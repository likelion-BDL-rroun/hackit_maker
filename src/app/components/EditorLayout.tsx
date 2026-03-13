import React, { useEffect, useCallback, useRef, useState } from 'react';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Canvas, type CanvasHandle } from './Canvas';
import { ZoomControls } from './ZoomControls';
import { MobileBottomPanel } from './MobileBottomPanel';
import { useEditorStore } from '../store/useEditorStore';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { FORMATS } from '../store/types';
import { Undo2, Redo2, Download } from 'lucide-react';

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

  // ── PNG export ───────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    const node = document.getElementById('canvas-area');
    if (!node) {
      toast.error('캔버스를 찾을 수 없습니다');
      return;
    }

    const title = useEditorStore.getState().title || '디자인';
    const currentFormat = useEditorStore.getState().format;
    const exportWidth = FORMATS[currentFormat].width;
    const exportHeight = FORMATS[currentFormat].height;

    const moveableEls = document.querySelectorAll('.moveable-control-box');
    moveableEls.forEach((el) => ((el as HTMLElement).style.display = 'none'));
    const overlayEls = node.querySelectorAll('.editor-overlay');
    overlayEls.forEach((el) => ((el as HTMLElement).style.display = 'none'));
    const prevFilter = node.style.filter;
    const prevOverflow = node.style.overflow;
    node.style.filter = 'none';
    node.style.overflow = 'hidden';

    try {
      toast('내보내기 준비 중...', { duration: 2000 });

      const dataUrl = await toPng(node, {
        quality: 1.0,
        pixelRatio: 1,
        canvasWidth: exportWidth,
        canvasHeight: exportHeight,
        style: { transform: 'scale(1)', transformOrigin: 'top left', overflow: 'hidden' },
        width: exportWidth,
        height: exportHeight,
        backgroundColor: useEditorStore.getState().backgroundColor,
      });

      const link = document.createElement('a');
      link.download = `${title}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(`PNG로 내보내기 완료! (${exportWidth}×${exportHeight}px)`);
    } catch (error) {
      console.error(error);
      toast.error('내보내기에 실패했습니다');
    } finally {
      node.style.filter = prevFilter;
      node.style.overflow = prevOverflow;
      overlayEls.forEach((el) => ((el as HTMLElement).style.display = ''));
      moveableEls.forEach((el) => ((el as HTMLElement).style.display = ''));
    }
  }, [format]);

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
