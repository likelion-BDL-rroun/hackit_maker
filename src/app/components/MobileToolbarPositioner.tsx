import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { EditorElement } from '../store/types';

const TOOLBAR_GAP = 14; // min gap between toolbar and selection
const HEADER_H = 52;    // top header height
const BOTTOM_TAB_H = 64; // bottom tab bar height
const EDGE_PAD = 8;      // horizontal safety padding from screen edge

interface Props {
  element: EditorElement;
  scale: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

/**
 * Positions a mobile toolbar near the selected element.
 * - If the element is in the upper half of the viewport → toolbar below
 * - If in the lower half → toolbar above
 * - Horizontally centered on the element, clamped to viewport edges
 * - Uses fixed positioning (not affected by canvas scale/scroll)
 */
export const MobileToolbarPositioner = ({
  element,
  scale,
  containerRef,
  canvasRef,
  children,
}: Props) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const compute = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const toolbar = toolbarRef.current;
    if (!canvas || !container || !toolbar) return;

    // Canvas origin in viewport coords
    const canvasRect = canvas.getBoundingClientRect();
    const canvasOriginX = canvasRect.left;
    const canvasOriginY = canvasRect.top;

    // Element's screen-space bounding box (accounting for canvas scale)
    const elScreenX = canvasOriginX + element.x * scale;
    const elScreenY = canvasOriginY + element.y * scale;
    const elScreenW = element.width * scale;
    const elScreenH = element.height * scale;
    const elCenterX = elScreenX + elScreenW / 2;
    const elBottom = elScreenY + elScreenH;

    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const tbW = toolbar.offsetWidth;
    const tbH = toolbar.offsetHeight;

    // Available space above & below the element
    const spaceAbove = elScreenY - HEADER_H;
    const spaceBelow = vpH - BOTTOM_TAB_H - elBottom;

    let top: number;
    if (spaceBelow >= tbH + TOOLBAR_GAP) {
      // Place below the element
      top = elBottom + TOOLBAR_GAP;
    } else if (spaceAbove >= tbH + TOOLBAR_GAP) {
      // Place above the element
      top = elScreenY - tbH - TOOLBAR_GAP;
    } else {
      // Not enough room on either side — place where there's more space
      if (spaceBelow > spaceAbove) {
        top = elBottom + TOOLBAR_GAP;
      } else {
        top = elScreenY - tbH - TOOLBAR_GAP;
      }
    }

    // Clamp vertically
    top = Math.max(HEADER_H + 4, Math.min(top, vpH - BOTTOM_TAB_H - tbH - 4));

    // Center horizontally on element, clamp to viewport
    let left = elCenterX - tbW / 2;
    left = Math.max(EDGE_PAD, Math.min(left, vpW - tbW - EDGE_PAD));

    setPos({ left, top });
  }, [element, scale, canvasRef, containerRef]);

  // Recompute on mount, scroll, resize
  useEffect(() => {
    const raf = requestAnimationFrame(compute);
    const container = containerRef.current;

    const handler = () => requestAnimationFrame(compute);
    container?.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      container?.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }, [compute, containerRef]);

  // Also recompute when element position/size changes
  useEffect(() => {
    requestAnimationFrame(compute);
  }, [element.x, element.y, element.width, element.height, scale, compute]);

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[200]"
      style={{
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        pointerEvents: 'auto',
        opacity: pos ? 1 : 0,
        transition: 'opacity 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
};
