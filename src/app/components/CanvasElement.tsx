import React, { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { cn } from '../../lib/utils';
import { EditorElement, FORMATS } from '../store/types';

interface CanvasElementProps {
  element: EditorElement;
  themeColor: string;
  isSelected: boolean;
  onSelect: () => void;
}

const MIN_TEXT_WIDTH = 24;
const MIN_TEXT_HEIGHT = 20;

export const CanvasElement = ({ element, themeColor, isSelected, onSelect }: CanvasElementProps) => {
  const { updateElement, editingTextId, setEditingTextId, interactionMode, format } = useEditorStore();
  const canvasW = FORMATS[format].width;
  const elementRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const isText = element.type === 'text';
  const isEditing = editingTextId === element.id;
  const lastTapRef = useRef<number>(0);

  // Measure the text div's natural content size and sync to store.
  // Auto-centers elements that were placed spanning the full canvas width (x≈0, width≈canvasW).
  const measureAndSync = useCallback(() => {
    if (!isText || !textRef.current) return;
    const el = textRef.current;
    const measuredW = Math.max(el.offsetWidth, MIN_TEXT_WIDTH);
    const measuredH = Math.max(el.offsetHeight, MIN_TEXT_HEIGHT);

    const updates: Partial<EditorElement> = {};

    if (Math.abs(measuredW - element.width) > 0.5 || Math.abs(measuredH - element.height) > 0.5) {
      updates.width = measuredW;
      updates.height = measuredH;
    }

    // Auto-center: element placed at x≈0 with width≈canvasW and textAlign center
    if (
      element.style?.textAlign === 'center' &&
      element.width >= canvasW - 10 &&
      element.x <= 10
    ) {
      updates.width = measuredW;
      updates.height = measuredH;
      updates.x = Math.round((canvasW - measuredW) / 2);
    }

    if (Object.keys(updates).length > 0) {
      updateElement(element.id, updates);
    }
  }, [isText, element.id, element.width, element.height, element.x, element.style?.textAlign, canvasW, updateElement]);

  // Re-measure whenever font size, weight, or content changes in the store
  useEffect(() => {
    if (!isText) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => measureAndSync());
    });
    return () => cancelAnimationFrame(id);
  }, [isText, element.style?.fontSize, element.style?.fontWeight, element.content, measureAndSync]);

  // Also measure right after mount
  useEffect(() => {
    if (!isText) return;
    const timer = setTimeout(() => measureAndSync(), 120);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing && textRef.current) {
      const el = textRef.current;
      el.focus();
      // Place cursor at end
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  // Exit edit mode when this element is deselected
  useEffect(() => {
    if (!isSelected && isEditing) {
      setEditingTextId(null);
    }
  }, [isSelected, isEditing, setEditingTextId]);

  // ---- handlers ----
  const handleInput = useCallback(() => {
    requestAnimationFrame(() => measureAndSync());
  }, [measureAndSync]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (!isText) return;
    const newContent = e.currentTarget.innerText;
    updateElement(element.id, { content: newContent });
    // Exit edit mode on blur
    if (isEditing) {
      setEditingTextId(null);
    }
    requestAnimationFrame(() => measureAndSync());
  }, [isText, element.id, updateElement, measureAndSync, isEditing, setEditingTextId]);

  // Enter edit mode: double-tap or second tap on already-selected text
  const enterEditMode = useCallback(() => {
    if (!isText || element.locked) return;
    setEditingTextId(element.id);
  }, [isText, element.id, element.locked, setEditingTextId]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing) return; // Already editing, let cursor work

    if (isSelected && isText && !element.locked) {
      // Second tap on already-selected text → enter edit mode
      enterEditMode();
    } else {
      onSelect();
    }
  }, [isSelected, isText, isEditing, element.locked, onSelect, enterEditMode]);

  // Touch: detect double-tap for mobile text editing
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isText || element.locked) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    lastTapRef.current = now;

    if (isSelected && !isEditing) {
      if (timeSinceLastTap < 350) {
        // Double-tap → enter edit mode
        e.preventDefault();
        enterEditMode();
      }
    }
  }, [isText, element.locked, isSelected, isEditing, enterEditMode]);

  if (!element.visible) return null;

  return (
    <div
      ref={elementRef}
      id={element.id}
      className={cn(
        'absolute origin-center select-none',
        element.locked ? 'cursor-default' : isEditing ? 'cursor-text' : 'cursor-move',
        isSelected ? 'z-10' : 'z-0',
      )}
      style={{
        ...(isText
          ? { width: `${element.width}px`, height: `${element.height}px`, overflow: 'visible' }
          : { width: `${element.width}px`, height: `${element.height}px` }),
        transform: `translate(${element.x}px, ${element.y}px) rotate(${element.rotation}deg)`,
        position: 'absolute',
        top: 0,
        left: 0,
        willChange: 'transform',
        opacity: element.style?.opacity ?? 1,
      }}
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
    >
      {isText ? (
        <div
          ref={textRef}
          className={cn(
            "outline-none",
            isEditing && "ring-2 ring-[#FF6000]/40 rounded-sm"
          )}
          style={{
            fontFamily: "'Cabinet Grotesk', sans-serif",
            fontSize: `${element.style?.fontSize || 16}px`,
            fontWeight: element.style?.fontWeight || 400,
            color: themeColor,
            textAlign: (element.style?.textAlign as any) || 'left',
            lineHeight: element.style?.lineHeight ?? 1.3,
            letterSpacing: element.style?.letterSpacing ? `${element.style.letterSpacing}px` : undefined,
            padding: '4px 6px',
            whiteSpace: 'pre',
            width: 'max-content',
            display: 'inline-block',
            // When editing, prevent Moveable from dragging
            pointerEvents: isEditing ? 'auto' : undefined,
          }}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={handleBlur}
          onInput={handleInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
            }
            // Escape exits edit mode
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setEditingTextId(null);
              (e.currentTarget as HTMLDivElement).blur();
            }
          }}
          onMouseDown={(e) => {
            // When editing, stop propagation so Moveable doesn't start dragging
            if (isEditing) {
              e.stopPropagation();
            }
          }}
          onTouchStart={(e) => {
            // When editing, stop propagation so Moveable doesn't start dragging
            if (isEditing) {
              e.stopPropagation();
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (!element.locked && !isEditing) {
              enterEditMode();
            }
          }}
        >
          {element.content}
        </div>
      ) : (
        <div className="w-full h-full pointer-events-none flex items-center justify-center">
          {element.imageUrl ? (
            <div
              className="w-full h-full"
              style={{
                backgroundColor: themeColor,
                WebkitMaskImage: `url(${element.imageUrl})`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskImage: `url(${element.imageUrl})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
              }}
            />
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
              <path d={element.content} fill={themeColor} />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};