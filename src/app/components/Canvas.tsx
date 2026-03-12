import React, { useRef, useState, useEffect, useCallback, useMemo, useImperativeHandle } from 'react';
import Moveable from 'react-moveable';
import { useEditorStore } from '../store/useEditorStore';
import { FORMATS } from '../store/types';
import { cn } from '../../lib/utils';
import { CanvasElement } from './CanvasElement';
import { ContextToolbar } from './ContextToolbar';
import { MobileToolbarPositioner } from './MobileToolbarPositioner';
import iconArrowSync from '../../assets/icon_arrow-sync.svg';

// Print safe area margins
const A3_PRINT_MARGIN = 118;

// Breathing room padding around artboard
const CANVAS_PADDING = 40;

// Mobile bottom bar height — kept for backward compat but new layout has no bottom tab
const MOBILE_BOTTOM_TAB_H = 0;

export interface CanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  zoomTo100: () => void;
}

interface CanvasProps {
  onExport?: () => void;
}

export const Canvas = React.forwardRef<CanvasHandle, CanvasProps>(({ onExport }, ref) => {
  const {
    selectedIds, elements, scale, setScale, format, backgroundColor, themeColor,
    showMargins, showPrintSafeArea, printPreviewMode, interactionMode,
    deselectAll, editingTextId,
    selectElement, pushHistory, updateElement, setInteractionMode, sidebarOpen,
    mobileTextMenuOpen,
  } = useEditorStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<HTMLElement | SVGElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isSnapping, setIsSnapping] = useState(false);
  const [snapAngle, setSnapAngle] = useState<number | null>(null);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSafeAreaTooltip, setShowSafeAreaTooltip] = useState(false);
  const [badgePos, setBadgePos] = useState<{ x: number; y: number } | null>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  // Track initial state for text font-size scaling during resize
  const resizeInitRef = useRef<{ width: number; height: number; fontSize: number } | null>(null);

  // Smart guide: DOM elements of all non-selected, visible elements
  const elementGuidelines = useMemo(() => {
    return elements
      .filter(el => !selectedIds.includes(el.id) && el.visible !== false)
      .map(el => document.getElementById(el.id))
      .filter((el): el is HTMLElement => el !== null);
  }, [elements, selectedIds]);

  const isA3 = format === 'A3';
  const isMobile = containerSize.width > 0 && containerSize.width < 768;

  // Rotation snap constants
  const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315, 360];
  const SNAP_THRESHOLD = 5;

  const applyRotationSnap = useCallback((rawAngle: number): { angle: number; snapped: boolean; snapTarget: number | null } => {
    const normalized = ((rawAngle % 360) + 360) % 360;
    for (const snap of SNAP_ANGLES) {
      const diff = Math.abs(normalized - snap);
      const wrapDiff = Math.abs(normalized - (snap === 360 ? 0 : snap + 360));
      if (diff <= SNAP_THRESHOLD || wrapDiff <= SNAP_THRESHOLD) {
        const base = rawAngle - normalized;
        const finalSnap = snap === 360 ? 0 : snap;
        return { angle: base + finalSnap, snapped: true, snapTarget: finalSnap };
      }
    }
    return { angle: rawAngle, snapped: false, snapTarget: null };
  }, []);

  const getDimensions = useCallback(() => {
    return { width: FORMATS[format].width, height: FORMATS[format].height };
  }, [format]);

  const { width, height } = getDimensions();

  // A3 print margins
  const printMargins = useMemo(() => {
    if (!isA3 || !showPrintSafeArea) return null;
    return {
      top: A3_PRINT_MARGIN,
      bottom: A3_PRINT_MARGIN,
      left: A3_PRINT_MARGIN,
      right: A3_PRINT_MARGIN,
    };
  }, [isA3, showPrintSafeArea]);

  // Detect elements crossing print safe area
  const elementsOutsideSafeArea = useMemo(() => {
    if (!printMargins) return new Set<string>();
    const outside = new Set<string>();
    for (const el of elements) {
      if (!el.visible) continue;
      if (
        el.x < printMargins.left ||
        el.y < printMargins.top ||
        el.x + el.width > width - printMargins.right ||
        el.y + el.height > height - printMargins.bottom
      ) {
        outside.add(el.id);
      }
    }
    return outside;
  }, [elements, printMargins, width, height]);

  // Calculate fit scale — accounts for mobile bottom tab bar
  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    // Use clientWidth/clientHeight for the actual available viewport (excludes scrollbar)
    const vpWidth = container.clientWidth;
    const vpHeight = container.clientHeight;
    if (vpWidth <= 0 || vpHeight <= 0) return;
    const isMobileNow = vpWidth < 768;
    const padding = isMobileNow ? 32 : 80;
    // On mobile, subtract the bottom tab bar height from available area
    const bottomChrome = isMobileNow ? MOBILE_BOTTOM_TAB_H : 0;
    const availW = vpWidth - padding * 2;
    const availH = vpHeight - padding * 2 - bottomChrome;
    if (availW <= 0 || availH <= 0) return;
    const scaleW = availW / width;
    const scaleH = availH / height;
    const fitScale = Math.round(Math.min(scaleW, scaleH) * 100) / 100;
    const clampedScale = Math.max(0.02, Math.min(fitScale, 1));
    setScale(clampedScale);

    // Center scroll after scale update
    requestAnimationFrame(() => {
      const newScaledW = width * clampedScale;
      const newScaledH = height * clampedScale;
      const contentW = Math.max(newScaledW + CANVAS_PADDING * 2, container.clientWidth);
      const contentH = Math.max(newScaledH + CANVAS_PADDING * 2, container.clientHeight);
      container.scrollLeft = (contentW - container.clientWidth) / 2;
      container.scrollTop = (contentH - container.clientHeight) / 2;
    });
  }, [width, height, setScale]);

  // Auto-fit on format change
  useEffect(() => {
    const timer = setTimeout(fitToScreen, 50);
    return () => clearTimeout(timer);
  }, [fitToScreen, format]);

  // Observe container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Re-fit when sidebar toggles
  useEffect(() => {
    const timer = setTimeout(fitToScreen, 350);
    return () => clearTimeout(timer);
  }, [sidebarOpen, fitToScreen]);

  useEffect(() => {
    if (selectedIds.length === 1) {
      const el = document.getElementById(selectedIds[0]);
      setTarget(el);
    } else {
      setTarget(null);
    }
  }, [selectedIds, elements]);

  // Center-anchored zoom via Ctrl+Wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;

        const oldScale = scale;
        const delta = e.deltaY > 0 ? 0.93 : 1.07;
        const newScale = Math.round(Math.min(Math.max(oldScale * delta, 0.1), 4) * 100) / 100;

        // Anchor zoom to the point under the cursor in viewport coords
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left + container.scrollLeft;
        const cursorY = e.clientY - rect.top + container.scrollTop;

        // Where cursor is relative to grid content
        const contentW = Math.max(container.scrollWidth, rect.width);
        const contentH = Math.max(container.scrollHeight, rect.height);
        const oldScaledW = width * oldScale;
        const oldScaledH = height * oldScale;
        // artboard origin in the content area
        const artboardLeft = Math.max((contentW - oldScaledW) / 2, CANVAS_PADDING);
        const artboardTop = Math.max((contentH - oldScaledH) / 2, CANVAS_PADDING);

        // cursor position in logical canvas coords
        const logicalX = (cursorX - artboardLeft) / oldScale;
        const logicalY = (cursorY - artboardTop) / oldScale;

        setScale(newScale);

        // After scale update, adjust scroll to keep cursor anchored
        requestAnimationFrame(() => {
          const newScaledW = width * newScale;
          const newScaledH = height * newScale;
          const newContentW = Math.max(newScaledW + CANVAS_PADDING * 2, rect.width);
          const newContentH = Math.max(newScaledH + CANVAS_PADDING * 2, rect.height);
          const newArtboardLeft = Math.max((newContentW - newScaledW) / 2, CANVAS_PADDING);
          const newArtboardTop = Math.max((newContentH - newScaledH) / 2, CANVAS_PADDING);

          const newCursorX = newArtboardLeft + logicalX * newScale;
          const newCursorY = newArtboardTop + logicalY * newScale;

          container.scrollLeft = newCursorX - (e.clientX - rect.left);
          container.scrollTop = newCursorY - (e.clientY - rect.top);
        });
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [scale, setScale, width, height]);

  // Block Safari gesturestart (pinch-zoom) and multi-touch on canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /*
     * gesturestart/gesturechange: Moveable 조작 중에는 블록하지 않음.
     * isDragging 중 preventDefault하면 Moveable 내부 이벤트 체인이 끊겨
     * 제스처가 불완전하게 종료되며 상태가 잠길 수 있음.
     * 단, 아무것도 조작하지 않을 때(idle)에만 pinch-zoom 차단.
     */
    const blockGesture = (e: Event) => {
      const store = (window as any).__editorInteracting;
      if (!store) e.preventDefault();
    };

    // 멀티터치 스크롤/줌 차단 — Moveable 조작 중이 아닐 때만
    const blockMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1 && !(window as any).__editorInteracting) {
        e.preventDefault();
      }
    };

    container.addEventListener('gesturestart', blockGesture, { passive: false } as any);
    container.addEventListener('gesturechange', blockGesture, { passive: false } as any);
    container.addEventListener('touchmove', blockMultiTouch, { passive: false });
    return () => {
      container.removeEventListener('gesturestart', blockGesture);
      container.removeEventListener('gesturechange', blockGesture);
      container.removeEventListener('touchmove', blockMultiTouch);
    };
  }, []);

  // Standard margins
  const getMargins = () => {
    if (!showMargins) return null;
    const marginMap: Record<string, { top: number; bottom: number; left: number; right: number }> = {
      '1:1': { top: 60, bottom: 60, left: 60, right: 60 },
      '4:5': { top: 135, bottom: 135, left: 60, right: 60 },
      '9:16': { top: 250, bottom: 250, left: 60, right: 60 },
      'A3': { top: 118, bottom: 118, left: 118, right: 118 },
    };
    return marginMap[format];
  };

  const margins = getMargins();

  const selectedElement = selectedIds.length === 1 ? elements.find(e => e.id === selectedIds[0]) : null;
  const isGraphic = selectedElement?.type === 'graphic';
  const isText = selectedElement?.type === 'text';

  // ─── Scale-invariant Moveable handle styles ───
  // 캔버스는 CSS transform:scale로 축소/확대되므로 Moveable 핸들도 함께 축소됨.
  // scale의 역수를 곱해 항상 동일한 화면 픽셀 크기를 유지하도록 보정한다.
  const moveableScaleStyle = useMemo(() => {
    const s = Math.max(0.05, scale);

    // 화면에서 보이길 원하는 실제 픽셀 크기
    const LINE        = 1;    // 선택 외곽선 두께 (px)
    const HANDLE      = 8;    // 리사이즈 핸들 크기 (px) — 정사각형
    const HANDLE_STK  = 0.5;  // 리사이즈 핸들 orange 스트로크 (px)
    const ROT         = 20;   // 회전 핸들 크기 (px) — 커스텀 아이콘
    const TOUCH_H     = 10;   // 터치 모드 리사이즈 핸들 (px)
    const TOUCH_ROT   = 24;   // 터치 모드 회전 핸들 (px)
    const TOUCH_HIT   = 44;   // 터치 히트 영역 (px)
    const TOUCH_HIT_R = 52;   // 회전 핸들 터치 히트 영역 (px)

    // 캔버스 좌표계에서의 크기 = 화면 픽셀 크기 / scale
    const l   = LINE        / s;
    const h   = HANDLE      / s;
    const hs  = HANDLE_STK  / s;
    const r   = ROT         / s;
    const th  = TOUCH_H     / s;
    const tr  = TOUCH_ROT   / s;
    const tt  = TOUCH_HIT   / s;
    const ttr = TOUCH_HIT_R / s;

    return `
      /* ── 선택 외곽선: moveable-direction만 타겟 (회전 가이드선 제외) ── */
      .moveable-line.moveable-direction {
        height: ${l}px !important;
      }

      /* ── 회전 가이드선: 숨김 ── */
      .moveable-rotation-line {
        display: none !important;
      }

      /* ── 리사이즈 핸들: 정사각형 / white fill / orange 0.5px 스트로크 ── */
      .moveable-control {
        width:         ${h}px !important;
        height:        ${h}px !important;
        margin-top:    ${-h / 2}px !important;
        margin-left:   ${-h / 2}px !important;
        border-radius: 0 !important;
        border:        ${hs}px solid #FF6000 !important;
        z-index: 1 !important;
      }

      /* ── 회전 핸들: 커스텀 아이콘 (::after로 오버레이) ── */
      .moveable-rotation-control {
        width:         ${r}px !important;
        height:        ${r}px !important;
        margin-top:    ${-r / 2}px !important;
        margin-left:   ${-r / 2}px !important;
        border-radius: 0 !important;
        border:        none !important;
        background:    transparent !important;
        box-shadow:    none !important;
        z-index:       10 !important;
      }
      .moveable-rotation-control::after {
        content:             '' !important;
        position:            absolute !important;
        top:                 0 !important;
        left:                0 !important;
        width:               100% !important;
        height:              100% !important;
        background-image:    url("${iconArrowSync}") !important;
        background-size:     contain !important;
        background-repeat:   no-repeat !important;
        background-position: center !important;
        pointer-events:      none !important;
      }

      /* ── 투명 터치 히트 영역 확장 (모든 디바이스) ── */
      .moveable-control::before {
        content: '';
        position: absolute;
        top: 50%; left: 50%;
        width:  ${tt}px;
        height: ${tt}px;
        transform: translate(-50%, -50%);
      }
      .moveable-rotation-control::before {
        content: '';
        position: absolute;
        top: 50%; left: 50%;
        width:  ${ttr}px;
        height: ${ttr}px;
        transform: translate(-50%, -50%);
      }

      /* ── 터치 디바이스: 핸들을 더 크게 ── */
      @media (pointer: coarse) {
        .moveable-control {
          width:       ${th}px !important;
          height:      ${th}px !important;
          margin-top:  ${-th / 2}px !important;
          margin-left: ${-th / 2}px !important;
        }
        .moveable-rotation-control {
          width:       ${tr}px !important;
          height:      ${tr}px !important;
          margin-top:  ${-tr / 2}px !important;
          margin-left: ${-tr / 2}px !important;
        }
      }
    `;
  }, [scale]);

  // Center-anchored programmatic zoom
  const zoomCentered = useCallback((newScale: number) => {
    const container = containerRef.current;
    if (!container) {
      setScale(newScale);
      return;
    }
    const oldScale = scale;
    const rect = container.getBoundingClientRect();

    // Viewport center in scroll coords
    const vpCenterX = container.scrollLeft + rect.width / 2;
    const vpCenterY = container.scrollTop + rect.height / 2;

    // Content metrics for old scale
    const oldScaledW = width * oldScale;
    const oldScaledH = height * oldScale;
    const oldContentW = Math.max(oldScaledW + CANVAS_PADDING * 2, rect.width);
    const oldContentH = Math.max(oldScaledH + CANVAS_PADDING * 2, rect.height);
    const oldArtLeft = Math.max((oldContentW - oldScaledW) / 2, CANVAS_PADDING);
    const oldArtTop = Math.max((oldContentH - oldScaledH) / 2, CANVAS_PADDING);

    // Logical center point
    const logX = (vpCenterX - oldArtLeft) / oldScale;
    const logY = (vpCenterY - oldArtTop) / oldScale;

    setScale(newScale);

    requestAnimationFrame(() => {
      const newScaledW = width * newScale;
      const newScaledH = height * newScale;
      const newContentW = Math.max(newScaledW + CANVAS_PADDING * 2, rect.width);
      const newContentH = Math.max(newScaledH + CANVAS_PADDING * 2, rect.height);
      const newArtLeft = Math.max((newContentW - newScaledW) / 2, CANVAS_PADDING);
      const newArtTop = Math.max((newContentH - newScaledH) / 2, CANVAS_PADDING);

      container.scrollLeft = newArtLeft + logX * newScale - rect.width / 2;
      container.scrollTop = newArtTop + logY * newScale - rect.height / 2;
    });
  }, [scale, setScale, width, height]);

  const zoomIn = () => zoomCentered(Math.min(Math.round((scale + 0.1) * 100) / 100, 4));
  const zoomOut = () => zoomCentered(Math.max(Math.round((scale - 0.1) * 100) / 100, 0.1));
  const zoomTo100 = () => zoomCentered(1);

  // Expose zoom methods to parent via ref
  useImperativeHandle(ref, () => ({
    zoomIn,
    zoomOut,
    fitToScreen,
    zoomTo100,
  }), [scale, zoomCentered, fitToScreen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scaled visual dimensions for the layout wrapper
  const scaledW = width * scale;
  const scaledH = height * scale;

  // Extra bottom padding on mobile to clear bottom tab bar
  const bottomExtra = isMobile ? MOBILE_BOTTOM_TAB_H : 0;

  // --- Print safe area badge position tracking ---
  // badge.left = frame.left, badge.bottom = frame.top - GAP
  // Badge sits ABOVE the poster frame, left-aligned with the frame's left edge.
  const BADGE_FRAME_GAP = 10; // px gap between badge bottom and frame top
  const updateBadgePosition = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const badge = badgeRef.current;
    if (!canvas || !container) { setBadgePos(null); return; }
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const badgeH = badge ? badge.offsetHeight : 30; // fallback ~30px
    setBadgePos({
      x: canvasRect.left - containerRect.left,                          // badge.left = frame.left
      y: canvasRect.top - containerRect.top - badgeH - BADGE_FRAME_GAP, // badge.bottom = frame.top - gap
    });
  }, []);

  // Re-compute badge position on scroll, resize, scale, or format change
  useEffect(() => {
    if (!printMargins) { setBadgePos(null); return; }
    // Initial calc (with a rAF to wait for layout)
    const raf = requestAnimationFrame(updateBadgePosition);
    const container = containerRef.current;
    if (!container) return () => cancelAnimationFrame(raf);
    // Scroll listener
    container.addEventListener('scroll', updateBadgePosition, { passive: true });
    // Resize observer
    const ro = new ResizeObserver(updateBadgePosition);
    ro.observe(container);
    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('scroll', updateBadgePosition);
      ro.disconnect();
    };
  }, [printMargins, updateBadgePosition, scale, format]);

  return (
    <>
    {/* Scale-invariant Moveable handle overrides — 캔버스 축소 시에도 동일한 크기 유지 */}
    <style>{moveableScaleStyle}</style>
    <div
      ref={containerRef}
      className={cn(
        "flex-1 bg-[#E8E8E8] relative select-none scrollbar-hidden",
        isDragging ? "overflow-hidden" : "overflow-auto"
      )}
      style={{
        /*
         * 엘리먼트가 선택된 상태(핸들 표시 중)에서는 touchAction을 'none'으로 유지.
         * 이유: iOS Safari는 touchAction:'pan-x pan-y' 상태에서 터치가 시작되면
         * 즉시 스크롤 제스처로 commit하기 때문에, Moveable의 onResizeStart에서
         * isDragging을 true로 바꿔도 이미 늦어서 탭 크래시가 발생함.
         * 핸들이 노출될 수 있는 모든 상황(선택 중 or 드래그 중)에서 'none' 적용.
         */
        touchAction: (isDragging || selectedIds.length > 0) ? 'none' : 'pan-x pan-y',
        overscrollBehavior: 'contain',
      }}
      onClick={(e) => {
        if (e.target === containerRef.current || e.target === e.currentTarget) {
          selectElement('', false);
        }
      }}
    >
      {/* Scrollable content area with centering via min dimensions + grid */}
      <div
        className="grid place-items-center"
        style={{
          minWidth: '100%',
          minHeight: '100%',
          padding: `${CANVAS_PADDING}px`,
          paddingBottom: `${CANVAS_PADDING + bottomExtra}px`,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            selectElement('', false);
          }
        }}
      >
        {/* Canvas layout wrapper — collapses to scaled visual size */}
        <div
          className="relative shrink-0"
          style={{
            width: `${scaledW}px`,
            height: `${scaledH}px`,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              selectElement('', false);
            }
          }}
        >
          {/* Actual canvas — scaled via transform, pinned to top-left of wrapper */}
          <div
            className="absolute top-0 left-0 shadow-[0_2px_40px_rgba(0,0,0,0.08)] origin-top-left"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              transform: `scale(${scale})`,
              backgroundColor: backgroundColor,
              filter: printPreviewMode && isA3 ? 'saturate(0.78) contrast(0.96)' : undefined,
            }}
            ref={canvasRef}
            id="canvas-area"
          >
            {/* Dot Grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03] editor-overlay"
              style={{
                backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Standard Margins */}
            {margins && (
              <div className="absolute inset-0 pointer-events-none z-[1] editor-overlay">
                <div className="absolute w-full" style={{ top: margins.top, borderBottom: `${1 / scale}px dashed rgba(0, 255, 255, 0.85)` }} />
                <div className="absolute w-full" style={{ bottom: margins.bottom, borderTop: `${1 / scale}px dashed rgba(0, 255, 255, 0.85)` }} />
                <div className="absolute h-full" style={{ left: margins.left, borderRight: `${1 / scale}px dashed rgba(0, 255, 255, 0.85)` }} />
                <div className="absolute h-full" style={{ right: margins.right, borderLeft: `${1 / scale}px dashed rgba(0, 255, 255, 0.85)` }} />
              </div>
            )}

            {/* A3 Print Safe Area */}
            {printMargins && (
              <div className="absolute inset-0 pointer-events-none z-[2] editor-overlay">
                {/* Dashed print boundary — scale-independent stroke */}
                <div
                  className="absolute rounded-sm"
                  style={{
                    top: printMargins.top,
                    left: printMargins.left,
                    right: printMargins.right,
                    bottom: printMargins.bottom,
                    border: `${1.5 / scale}px dashed rgba(0, 255, 255, 0.85)`,
                  }}
                />
                {/* Danger zone overlays (outside safe area) */}
                <div className="absolute top-0 left-0 right-0 bg-red-500/[0.03]" style={{ height: printMargins.top }} />
                <div className="absolute bottom-0 left-0 right-0 bg-red-500/[0.03]" style={{ height: printMargins.bottom }} />
                <div className="absolute bg-red-500/[0.03]" style={{ top: printMargins.top, bottom: printMargins.bottom, left: 0, width: printMargins.left }} />
                <div className="absolute bg-red-500/[0.03]" style={{ top: printMargins.top, bottom: printMargins.bottom, right: 0, width: printMargins.right }} />
              </div>
            )}

            {/* Warning highlights for elements outside safe area */}
            {isA3 && showPrintSafeArea && elementsOutsideSafeArea.size > 0 && (
              <div className="absolute inset-0 pointer-events-none z-[3] editor-overlay">
                {elements.filter(el => elementsOutsideSafeArea.has(el.id) && el.visible).map(el => (
                  <div
                    key={`warn-${el.id}`}
                    className="absolute rounded-sm"
                    style={{
                      left: el.x - 3,
                      top: el.y - 3,
                      width: el.width + 6,
                      height: el.height + 6,
                      border: '1.5px dashed rgba(245, 158, 11, 0.5)',
                      transform: `rotate(${el.rotation}deg)`,
                      transformOrigin: `${(el.width + 6) / 2}px ${(el.height + 6) / 2}px`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Elements */}
            {elements.map((el) => (
              el.visible !== false && (
                <CanvasElement
                  key={el.id}
                  element={el}
                  themeColor={themeColor}
                  isSelected={selectedIds.includes(el.id)}
                  onSelect={() => selectElement(el.id)}
                />
              )
            ))}

            {/* Moveable Controller — disable during text editing */}
            {target && selectedElement && !selectedElement.locked && interactionMode !== 'object_editing_text' && (
              <Moveable
                target={target}
                draggable={true}
                throttleDrag={0}
                resizable={!selectedElement?.isLogo}
                renderDirections={["nw", "ne", "sw", "se"]}
                keepRatio={isGraphic || isText}
                throttleResize={0}
                rotatable={true}
                rotationPosition="bottom"
                throttleRotate={0}
                snappable={true}
                snapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
                elementSnapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
                snapThreshold={5}
                elementGuidelines={elementGuidelines}
                snapGap={true}
                isDisplaySnapDigit={false}
                verticalGuidelines={[
                  0, width / 2, width,
                  margins?.left || 0, width - (margins?.right || 0),
                  ...(printMargins ? [printMargins.left, width - printMargins.right] : []),
                ]}
                horizontalGuidelines={[
                  0, height / 2, height,
                  margins?.top || 0, height - (margins?.bottom || 0),
                  ...(printMargins ? [printMargins.top, height - printMargins.bottom] : []),
                ]}
                bounds={{ left: -500, top: -500, right: width + 500, bottom: height + 500 }}
                onDragStart={({ set }) => {
                  const el = elements.find(e => e.id === selectedIds[0]);
                  if (el) {
                    set([el.x, el.y]);
                    pushHistory();
                  }
                  (window as any).__editorInteracting = true;
                  setIsDragging(true);
                  setInteractionMode('object_transforming');
                }}
                onDrag={({ target: t, beforeTranslate }) => {
                  const [x, y] = beforeTranslate;
                  const el = elements.find(e => e.id === selectedIds[0]);
                  t!.style.transform = `translate(${x}px, ${y}px) rotate(${el?.rotation || 0}deg)`;
                }}
                onDragEnd={({ lastEvent }) => {
                  if (lastEvent) {
                    const [x, y] = lastEvent.beforeTranslate;
                    updateElement(selectedIds[0], { x, y });
                  }
                  (window as any).__editorInteracting = false;
                  setIsDragging(false);
                  setInteractionMode('object_selected');
                }}
                onResizeStart={({ setOrigin, dragStart }) => {
                  setOrigin(['%', '%']);
                  const el = elements.find(e => e.id === selectedIds[0]);
                  if (el) {
                    dragStart && dragStart.set([el.x, el.y]);
                    pushHistory();
                  }
                  (window as any).__editorInteracting = true;
                  setIsDragging(true);
                  setInteractionMode('object_transforming');

                  // Track initial state for text font-size scaling
                  if (el && el.type === 'text') {
                    resizeInitRef.current = {
                      width: el.width,
                      height: el.height,
                      fontSize: el.style?.fontSize || 16,
                    };
                  } else {
                    resizeInitRef.current = null;
                  }
                }}
                onResize={({ target: t, width: w, height: h, drag }) => {
                  const [x, y] = drag.beforeTranslate;
                  const el = elements.find(e => e.id === selectedIds[0]);
                  t!.style.width = `${w}px`;
                  t!.style.height = `${h}px`;
                  t!.style.transform = `translate(${x}px, ${y}px) rotate(${el?.rotation || 0}deg)`;

                  // Live-preview font size scaling for text
                  if (resizeInitRef.current && t) {
                    // Math.max(1, ...) : width가 0일 때 Infinity 방지
                    const ratio = w / Math.max(1, resizeInitRef.current.width);
                    const newFontSize = Math.max(8, Math.round(resizeInitRef.current.fontSize * ratio));
                    const textChild = (t as HTMLElement).querySelector('[contenteditable], [style*="font-size"]') as HTMLElement;
                    if (textChild) {
                      textChild.style.fontSize = `${newFontSize}px`;
                    }
                  }
                }}
                onResizeEnd={({ lastEvent }) => {
                  if (lastEvent) {
                    const { width: w, height: h, drag } = lastEvent;
                    const [x, y] = drag.beforeTranslate;
                    if (resizeInitRef.current) {
                      // Text element: compute final font size from ratio
                      const ratio = w / Math.max(1, resizeInitRef.current.width);
                      const newFontSize = Math.max(8, Math.round(resizeInitRef.current.fontSize * ratio));
                      updateElement(selectedIds[0], {
                        x, y,
                        style: { ...elements.find(e => e.id === selectedIds[0])?.style, fontSize: newFontSize },
                      });
                      resizeInitRef.current = null;
                    } else {
                      updateElement(selectedIds[0], { width: w, height: h, x, y });
                    }
                  }
                  (window as any).__editorInteracting = false;
                  setIsDragging(false);
                  setInteractionMode('object_selected');
                }}
                onRotateStart={({ set }) => {
                  const el = elements.find(e => e.id === selectedIds[0]);
                  if (el) {
                    set(el.rotation);
                    pushHistory();
                  }
                  (window as any).__editorInteracting = true;
                  setIsDragging(true);
                  setInteractionMode('object_transforming');
                }}
                onRotate={({ target: t, beforeRotate }) => {
                  const el = elements.find(e => e.id === selectedIds[0]);
                  const { angle, snapped, snapTarget } = applyRotationSnap(beforeRotate);

                  if (snapped) {
                    setIsSnapping(true);
                    setSnapAngle(snapTarget);
                    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
                    snapTimerRef.current = setTimeout(() => {
                      setIsSnapping(false);
                      setSnapAngle(null);
                    }, 600);
                  } else {
                    setIsSnapping(false);
                    setSnapAngle(null);
                  }

                  t!.style.transform = `translate(${el?.x}px, ${el?.y}px) rotate(${angle}deg)`;
                }}
                onRotateEnd={({ lastEvent }) => {
                  if (lastEvent) {
                    const { angle } = applyRotationSnap(lastEvent.beforeRotate);
                    updateElement(selectedIds[0], { rotation: angle });
                  }
                  (window as any).__editorInteracting = false;
                  setIsDragging(false);
                  setInteractionMode('object_selected');
                  setIsSnapping(false);
                  if (snapTimerRef.current) {
                    clearTimeout(snapTimerRef.current);
                    snapTimerRef.current = null;
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ===== Print Safe Area Badge — overlay on containerRef, tracks canvas frame via getBoundingClientRect ===== */}
      {printMargins && badgePos && (
        <div
          className="absolute pointer-events-none z-[100]"
          style={{ inset: 0, overflow: 'visible' }}
        >
          <div
            ref={badgeRef}
            className="absolute pointer-events-auto"
            style={{ left: badgePos.x, top: badgePos.y }}
            onMouseEnter={() => setShowSafeAreaTooltip(true)}
            onMouseLeave={() => setShowSafeAreaTooltip(false)}
          >
            <div
              className="flex items-center gap-1.5 cursor-default"
              style={{
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 999,
                padding: '6px 14px',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            >
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-600 shrink-0">
                <span style={{ fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>!</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 500 }} className="text-gray-700 whitespace-nowrap">
                인쇄 안전 영역
              </span>
            </div>
            {/* Hover tooltip */}
            {showSafeAreaTooltip && (
              <div
                className="absolute"
                style={{
                  left: 0,
                  top: 38,
                  background: 'rgba(0,0,0,0.85)',
                  color: '#fff',
                  fontSize: 12,
                  lineHeight: 1.4,
                  padding: '10px 12px',
                  borderRadius: 10,
                  maxWidth: 260,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  whiteSpace: 'normal',
                  pointerEvents: 'none',
                  zIndex: 110,
                }}
              >
                각 변에서 10mm(184px) 안쪽이 안전 영역입니다. 중요한 텍스트와 그래픽은 안전 영역 안에 배치하세요.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Floating UI — rendered as siblings of the scroll area, using fixed positioning ===== */}
      {/* These are NOT inside any transformed/scrolled container, so fixed works reliably */}

      {/* Context Toolbar - Floating — always above the selected element, hide when editing text */}
      {selectedIds.length > 0 && selectedElement && interactionMode !== 'object_editing_text' && !isDragging && (
        <MobileToolbarPositioner
          element={selectedElement}
          scale={scale}
          containerRef={containerRef}
          canvasRef={canvasRef}
          preferAbove
        >
          <ContextToolbar isMobile={isMobile} />
        </MobileToolbarPositioner>
      )}

      {/* Out-of-safe-area warning pill */}
      {isA3 && showPrintSafeArea && elementsOutsideSafeArea.size > 0 && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
          style={{ bottom: isMobile ? `${MOBILE_BOTTOM_TAB_H + 56}px` : '96px' }}
        >
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 text-amber-700 px-3 py-1.5 rounded-full shadow-sm">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L11 10H1L6 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              <circle cx="6" cy="8" r="0.5" fill="currentColor" />
              <line x1="6" y1="4.5" x2="6" y2="6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: '10px', fontWeight: 600 }}>
              {elementsOutsideSafeArea.size}개 요소가 인쇄 안전 영역 밖에 있습니다
            </span>
          </div>
        </div>
      )}

      {/* Rotation Snap Indicator */}
      {isSnapping && snapAngle !== null && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
          style={{
            bottom: isMobile ? `${MOBILE_BOTTOM_TAB_H + 56}px` : '64px',
            animation: 'snapPulse 0.3s ease-out',
          }}
        >
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-lg">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-80">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1="7" y1="1" x2="7" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
              {snapAngle}°
            </span>
          </div>
        </div>
      )}

    </div>
    </>
  );
});