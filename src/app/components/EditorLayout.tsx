import React, { useEffect, useCallback, useRef, useState } from 'react';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Canvas, type CanvasHandle } from './Canvas';
import { ZoomControls } from './ZoomControls';
import { MobileBottomPanel } from './MobileBottomPanel';
import { useEditorStore } from '../store/useEditorStore';
import { toast } from 'sonner';
import { FORMATS, type EditorElement } from '../store/types';
import { Undo2, Redo2, Download } from 'lucide-react';

// ── Canvas 2D export helpers ─────────────────────────────────────────────────

/** Load an image and return it fully decoded (works on all browsers including mobile Safari) */
const loadImg = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve(img)).catch(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = reject;
    img.src = src;
  });

/** Draw a single tinted graphic onto ctx at (0,0) within the given element bounds */
const drawTintedGraphic = async (
  ctx: CanvasRenderingContext2D,
  imageUrl: string,
  color: string,
  elW: number,
  elH: number,
) => {
  const img = await loadImg(imageUrl);
  // Contain: preserve aspect ratio, centered
  const scale = Math.min(elW / img.naturalWidth, elH / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (elW - dw) / 2;
  const dy = (elH - dh) / 2;

  // Tint via offscreen canvas
  const tmp = document.createElement('canvas');
  tmp.width = Math.round(dw);
  tmp.height = Math.round(dh);
  const t = tmp.getContext('2d')!;
  t.drawImage(img, 0, 0, tmp.width, tmp.height);
  t.globalCompositeOperation = 'source-atop';
  t.fillStyle = color;
  t.fillRect(0, 0, tmp.width, tmp.height);

  ctx.drawImage(tmp, dx, dy);
};

/** Draw a text element onto ctx at (0,0) within the given element bounds */
const drawText = (
  ctx: CanvasRenderingContext2D,
  el: EditorElement,
  color: string,
) => {
  const fontSize = el.style?.fontSize || 16;
  const fontWeight = el.style?.fontWeight || 400;
  const lineHeight = el.style?.lineHeight ?? 1.3;
  const align = (el.style?.textAlign || 'left') as CanvasTextAlign;

  ctx.font = `${fontWeight} ${fontSize}px 'Cabinet Grotesk', sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  if (el.style?.letterSpacing) {
    (ctx as any).letterSpacing = `${el.style.letterSpacing}px`;
  }

  const padX = 6;
  const padY = 4;
  const lines = (el.content || '').split('\n');

  lines.forEach((line, i) => {
    let x = padX;
    if (align === 'center') x = el.width / 2;
    else if (align === 'right') x = el.width - padX;
    ctx.fillText(line, x, padY + i * fontSize * lineHeight);
  });
};

/** Render all elements to a canvas and return its data URL */
const renderToCanvas = async (
  elements: EditorElement[],
  width: number,
  height: number,
  backgroundColor: string,
  themeColor: string,
): Promise<string> => {
  // Ensure custom fonts are loaded before drawing text
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Draw each element in order (z-order matches array order)
  for (const el of elements) {
    if (!el.visible) continue;

    ctx.save();

    // Apply element transform: translate center → rotate → translate back
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.translate(-el.width / 2, -el.height / 2);
    ctx.globalAlpha = el.style?.opacity ?? 1;

    if (el.type === 'text') {
      drawText(ctx, el, themeColor);
    } else if (el.imageUrl) {
      await drawTintedGraphic(ctx, el.imageUrl, themeColor, el.width, el.height);
    } else if (el.content) {
      // Inline SVG path (viewBox 0 0 100 100)
      ctx.save();
      ctx.scale(el.width / 100, el.height / 100);
      ctx.fillStyle = themeColor;
      ctx.fill(new Path2D(el.content));
      ctx.restore();
    }

    ctx.restore();
  }

  return canvas.toDataURL('image/png', 1.0);
};

const MOBILE_BREAKPOINT = 744;

export const EditorLayout = () => {
  const { undo, redo, format, scale, history } = useEditorStore();
  const canvasRef = useRef<CanvasHandle>(null);

  // ── Mobile detection ──────────────────────────────────────────────────────
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowWidth <= MOBILE_BREAKPOINT;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // ── Global deselect on outside click ──────────────────────────────────────
  // Deselects when clicking anywhere except:
  //   1. The selected element itself
  //   2. Moveable control handles
  //   3. Any element marked with data-keep-selection (toolbar, right panel, popover)
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const state = useEditorStore.getState();
      if (state.selectedIds.length === 0) return;

      const target = e.target as HTMLElement;

      // Preserve selection for marked zones and moveable handles
      if (target.closest('[data-keep-selection]')) return;
      if (target.closest('.moveable-control-box')) return;
      if (target.closest('.moveable-line')) return;

      // Preserve selection if clicking on the selected element itself
      const selectedId = state.selectedIds[0];
      const selectedEl = selectedId ? document.getElementById(selectedId) : null;
      if (selectedEl && selectedEl.contains(target)) return;

      state.deselectAll();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, []);

  // ── PNG export (Canvas 2D — no html-to-image dependency) ─────────────────────
  // Renders directly via Canvas 2D API, which avoids the SVG foreignObject
  // serialization that fails on mobile Safari due to data-URL size limits.
  const handleExport = useCallback(async () => {
    const state = useEditorStore.getState();
    const { elements, backgroundColor, themeColor, title: storeTitle } = state;
    const currentFormat = state.format;
    const { width: exportWidth, height: exportHeight } = FORMATS[currentFormat];
    const title = storeTitle || '디자인';

    try {
      toast('내보내기 준비 중...', { duration: 3000 });

      // Wait 2 RAF frames to ensure all paints are settled
      await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      const dataUrl = await renderToCanvas(
        elements,
        exportWidth,
        exportHeight,
        backgroundColor,
        themeColor,
      );

      // Trigger download
      const link = document.createElement('a');
      link.download = `${title}.png`;
      link.href = dataUrl;
      link.click();

      toast.success(`PNG로 내보내기 완료! (${exportWidth}×${exportHeight}px)`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('내보내기에 실패했습니다');
    }
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['input', 'textarea'].includes(
        document.activeElement?.tagName.toLowerCase() || '',
      );
      const isEditable = document.activeElement?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && !isEditable) {
        const selected = useEditorStore.getState().selectedIds;
        if (selected.length > 0) {
          e.preventDefault();
          useEditorStore.getState().removeElements(selected);
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && !isInput && !isEditable) {
        e.preventDefault();
        const selected = useEditorStore.getState().selectedIds;
        if (selected.length === 1) {
          useEditorStore.getState().duplicateElement(selected[0]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        className="h-dvh w-screen overflow-hidden bg-[#F5F5F7] text-gray-900 flex flex-col"
        style={{ fontFamily: "'Cabinet Grotesk', system-ui, sans-serif" }}
      >
        {/* Top action bar */}
        <div
          className="shrink-0 flex items-center justify-between px-4 bg-[#F5F5F7]"
          style={{ height: 52 }}
        >
          {/* Undo / Redo */}
          <div className="flex items-center gap-1 bg-white rounded-[10px] border border-gray-200 px-1 py-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-gray-100 active:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-gray-100 active:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 h-9 px-4 bg-[#FF6000] hover:bg-[#E55600] text-white rounded-[10px] transition-all active:scale-[0.97] cursor-pointer"
            style={{ fontWeight: 700, fontSize: 13 }}
          >
            <Download className="w-4 h-4" />
            PNG
          </button>
        </div>

        {/* Canvas + floating bottom panel */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas ref={canvasRef} onExport={handleExport} />
          <MobileBottomPanel />
        </div>
      </div>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <div
      className="h-dvh w-screen overflow-hidden bg-[#F5F5F7] text-gray-900 flex items-center justify-center"
      style={{ fontFamily: "'Cabinet Grotesk', system-ui, sans-serif" }}
    >
      {/* Three-column fixed layout — centered on screen, top-aligned */}
      <div className="flex items-start" style={{ gap: 36 }}>

        {/* Left panel */}
        <div className="shrink-0">
          <LeftPanel />
        </div>

        {/* Center: editing area + zoom controls below */}
        <div className="flex flex-col shrink-0" style={{ gap: 16 }}>
          {/* Fixed 592×592 editing box */}
          <div
            className="relative overflow-hidden shrink-0 flex flex-col"
            style={{ width: 592, height: 592, borderRadius: 20 }}
          >
            <Canvas ref={canvasRef} onExport={handleExport} />
          </div>

          {/* Zoom controls — 16px below editing area */}
          <ZoomControls
            scale={scale}
            onZoomIn={() => canvasRef.current?.zoomIn()}
            onZoomOut={() => canvasRef.current?.zoomOut()}
            onFit={() => canvasRef.current?.fitToScreen()}
            onZoom100={() => canvasRef.current?.zoomTo100()}
            onExport={handleExport}
          />
        </div>

        {/* Right panel */}
        <div className="shrink-0">
          <RightPanel />
        </div>

      </div>
    </div>
  );
};
