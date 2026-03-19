import { useEditorStore } from '../store/useEditorStore';
import {
  Trash2, Copy,
  Minus, Plus, Bold,
  AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ─── Reusable: Inline editable font size input ───
const FontSizeInput = ({
  value,
  onChange,
  large,
}: {
  value: number;
  onChange: (v: number) => void;
  large?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) setDraft(String(value));
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const clamp = (v: number) => Math.max(1, Math.min(999, Math.round(v)));

  const commit = useCallback(() => {
    setIsEditing(false);
    const parsed = parseInt(draft, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setDraft(String(value));
      return;
    }
    const clamped = clamp(parsed);
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  }, [draft, value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); return; }
    if (e.key === 'Escape') { e.preventDefault(); setDraft(String(value)); setIsEditing(false); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      const next = clamp(value + step * dir);
      setDraft(String(next));
      onChange(next);
    }
  };

  const sz = large ? 'w-11 h-9' : 'w-9 h-6';
  const fs = large ? '13px' : '11px';

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(sz, "text-center text-gray-700 bg-gray-50 border border-[#FF6000]/40 rounded-[6px] outline-none selection:bg-orange-100")}
        style={{ fontSize: fs, fontWeight: 600, fontVariantNumeric: 'tabular-nums', padding: '0 2px' }}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(sz, "flex items-center justify-center text-gray-600 cursor-text rounded-[6px] hover:bg-gray-100 transition-colors")}
      style={{ fontSize: fs, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
      title="클릭하여 직접 입력"
    >
      {value}
    </span>
  );
};

// ─── Mobile icon button (min 44px touch target) ───
const MobileBtn = ({
  icon: Icon,
  label,
  onClick,
  active,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-0.5 rounded-[8px] transition-colors cursor-pointer",
      "min-w-[44px] min-h-[44px] px-1.5 py-1",
      active && "bg-orange-50 text-[#FF6000]",
      danger && !active && "text-gray-500 active:bg-red-50 active:text-red-500",
      !active && !danger && "text-gray-600 active:bg-gray-100",
    )}
    title={label}
  >
    <Icon className="w-6 h-6" />
    <span style={{ fontSize: '9px', fontWeight: 500, lineHeight: 1 }}>{label}</span>
  </button>
);

// ─── Font weight constants ───
const FONT_WEIGHTS = [
  { label: 'Light', short: 'Lt', value: 300 },
  { label: 'Regular', short: 'Rg', value: 400 },
  { label: 'Medium', short: 'Md', value: 500 },
  { label: 'SemiBold', short: 'Sb', value: 600 },
  { label: 'Bold', short: 'Bd', value: 700 },
  { label: 'ExtraBold', short: 'Eb', value: 800 },
  { label: 'Black', short: 'Bk', value: 900 },
];

// ═══════════════════════════════════════════════════════
// MOBILE GRAPHIC TOOLBAR
// 복제, 삭제
// ═══════════════════════════════════════════════════════
const MobileGraphicToolbar = () => {
  const {
    selectedIds, elements,
    removeElements, duplicateElement,
  } = useEditorStore();
  const selectedId = selectedIds[0];
  const element = elements.find(el => el.id === selectedId);
  if (!element) return null;

  return (
    <div
      data-keep-selection
      className="bg-white shadow-xl rounded-[12px] border border-gray-100 p-1.5 flex items-center gap-1"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <button onClick={() => duplicateElement(selectedId)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 active:bg-gray-100 rounded-[6px] text-gray-500 hover:text-blue-600 cursor-pointer" title="복제">
        <Copy className="w-4 h-4" />
      </button>
      <button onClick={() => removeElements([selectedId])} className="w-6 h-6 flex items-center justify-center hover:bg-red-50 active:bg-red-50 rounded-[6px] text-red-400 hover:text-red-600 cursor-pointer" title="삭제">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// 3-LEVEL MOBILE TEXT TOOLBAR SYSTEM
// Level 1: Floating near element (크기, 복사, 삭제, …)
// Level 2: Bottom pill bar (폰트 스타일, 크기, 정렬, 색상)
// Level 3: Detail card above level 2
// ═══════════════════════════════════════════════════════

// ─── Anchored weight popover (floats above toolbar, near Bold button) ───
const POPOVER_W = 172;

const FontWeightPopover = ({
  anchor,
  onClose,
}: {
  anchor: { centerX: number; topY: number };
  onClose: () => void;
}) => {
  const { selectedIds, elements, updateElement } = useEditorStore();
  const selectedId = selectedIds[0];
  const element = elements.find(el => el.id === selectedId);
  if (!element || element.type !== 'text') return null;

  const updateStyle = (key: string, value: any) => {
    updateElement(selectedId, { style: { ...element.style, [key]: value } });
  };

  const fontWeight = element.style?.fontWeight || 400;

  // Horizontal: center on Bold button, clamp within viewport
  const left = Math.max(8, Math.min(window.innerWidth - POPOVER_W - 8, anchor.centerX - POPOVER_W / 2));
  // Caret x offset relative to card left
  const caretX = Math.max(12, Math.min(POPOVER_W - 12, anchor.centerX - left));
  // Vertical: sit above the toolbar (gap of 10px)
  const bottom = window.innerHeight - anchor.topY + 10;

  return (
    <>
      {/* Dismiss backdrop */}
      <div
        data-keep-selection
        className="fixed inset-0 z-[998]"
        onPointerDown={() => onClose()}
      />

      {/* Popover card */}
      <div
        data-keep-selection
        className="fixed z-[999] bg-white rounded-[14px] overflow-hidden"
        style={{
          left,
          bottom,
          width: POPOVER_W,
          boxShadow: '0 8px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.06)',
          animation: 'popoverIn 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)',
          transformOrigin: `${caretX}px 100%`,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Caret (downward triangle pointing to Bold button) */}
        <div
          style={{
            position: 'absolute',
            bottom: -5,
            left: caretX - 5,
            width: 10,
            height: 10,
            background: 'white',
            transform: 'rotate(45deg)',
            borderRadius: '0 0 2px 0',
            zIndex: -1,
            boxShadow: '2px 2px 4px rgba(0,0,0,0.07)',
          }}
        />

        <div className="py-1.5 overflow-y-auto" style={{ maxHeight: 268 }}>
          {FONT_WEIGHTS.map(fw => {
            const isActive = fontWeight === fw.value;
            return (
              <button
                key={fw.value}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  updateStyle('fontWeight', fw.value);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-[7px] transition-colors cursor-pointer",
                  isActive ? "bg-[#FF6000]/5" : "active:bg-gray-50",
                )}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: fw.value,
                    fontFamily: "'Cabinet Grotesk', sans-serif",
                    color: isActive ? '#FF6000' : '#374151',
                  }}
                >
                  {fw.label}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? '#FF6000' : '#9CA3AF',
                  }}
                >
                  {isActive ? '✓' : fw.value}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};


// ─── Floating toolbar ───
const MobileTextToolbar = () => {
  const {
    selectedIds, elements, updateElement, removeElements, duplicateElement,
  } = useEditorStore();

  const [styleOpen, setStyleOpen] = useState(false);
  const [styleAnchor, setStyleAnchor] = useState<{ centerX: number; topY: number } | null>(null);
  const boldBtnRef = useRef<HTMLButtonElement>(null);

  const selectedId = selectedIds[0];
  const element = elements.find(el => el.id === selectedId);

  useEffect(() => {
    return () => setStyleOpen(false);
  }, []);

  if (!element || element.type !== 'text') return null;

  const updateStyle = (key: string, value: any) => {
    updateElement(selectedId, { style: { ...element.style, [key]: value } });
  };

  const fontSize = element.style?.fontSize || 16;

  const handleStyleToggle = () => {
    if (!styleOpen && boldBtnRef.current) {
      const rect = boldBtnRef.current.getBoundingClientRect();
      setStyleAnchor({ centerX: rect.left + rect.width / 2, topY: rect.top });
    }
    setStyleOpen(v => !v);
  };

  return (
    <>
      {/* ── Floating toolbar ── */}
      <div
        data-keep-selection
        className="bg-white shadow-xl rounded-[14px] border border-gray-100 p-1.5 flex items-center gap-1"
        style={{ animation: 'fadeIn 0.15s ease-out' }}
      >
        {/* Font size -/value/+ */}
        <button
          onClick={() => updateStyle('fontSize', Math.max(8, fontSize - 2))}
          className="w-6 h-6 flex items-center justify-center rounded-[6px] hover:bg-gray-100 active:bg-gray-100 cursor-pointer text-gray-600"
        >
          <Minus className="w-4 h-4" />
        </button>
        <FontSizeInput value={fontSize} onChange={(v) => updateStyle('fontSize', v)} large />
        <button
          onClick={() => updateStyle('fontSize', Math.min(999, fontSize + 2))}
          className="w-6 h-6 flex items-center justify-center rounded-[6px] hover:bg-gray-100 active:bg-gray-100 cursor-pointer text-gray-600"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        {/* Style (font weight) — anchors popover above itself */}
        <button
          ref={boldBtnRef}
          onClick={handleStyleToggle}
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded-[6px] cursor-pointer transition-colors",
            styleOpen ? "bg-[#FF6000]/10 text-[#FF6000]" : "text-gray-500 hover:bg-gray-100 active:bg-gray-100"
          )}
          title="폰트 굵기"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Copy */}
        <button
          onClick={() => duplicateElement(selectedId)}
          className="w-6 h-6 flex items-center justify-center rounded-[6px] text-gray-500 hover:bg-gray-100 active:bg-gray-100 cursor-pointer"
          title="복제"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Delete */}
        <button
          onClick={() => removeElements([selectedId])}
          className="w-6 h-6 flex items-center justify-center rounded-[6px] text-red-400 hover:bg-red-50 active:bg-red-50 hover:text-red-600 active:text-red-600 cursor-pointer"
          title="삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── Font weight popover, anchored above Bold button ── */}
      {styleOpen && styleAnchor && createPortal(
        <FontWeightPopover
          anchor={styleAnchor}
          onClose={() => setStyleOpen(false)}
        />,
        document.body,
      )}

      {/* Animations */}
      <style>{`
        @keyframes popoverIn {
          from { opacity: 0; transform: scale(0.88) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </>
  );
};

// ═══════════════════════════════════════════════════════
// DESKTOP TOOLBAR (unchanged)
// ═══════════════════════════════════════════════════════
const DesktopToolbar = () => {
  const {
    selectedIds, elements, themeColor, setThemeColor, updateElement, removeElements, duplicateElement,
  } = useEditorStore();

  const selectedId = selectedIds[0];
  const element = elements.find(el => el.id === selectedId);
  if (!element) return null;

  const isText = element.type === 'text';

  const updateStyle = (key: string, value: any) => {
    updateElement(selectedId, { style: { ...element.style, [key]: value } });
  };

  return (
    <div data-keep-selection className="bg-white shadow-xl rounded-[12px] border border-gray-100 p-1.5 flex items-center gap-1 z-50" style={{ animation: 'fadeIn 0.15s ease-out' }}>
      {isText && (
        <>
          {/* Font Weight Selector */}
          <div className="flex items-center border-r border-gray-200 pr-1.5 mr-0.5">
            <select
              value={element.style?.fontWeight || 400}
              onChange={(e) => updateStyle('fontWeight', parseInt(e.target.value))}
              className="h-7 px-2 rounded-[6px] bg-gray-50 border border-gray-200 text-gray-700 outline-none cursor-pointer"
              style={{ fontSize: '11px', fontWeight: 500 }}
            >
              {FONT_WEIGHTS.map(fw => (
                <option key={fw.value} value={fw.value}>{fw.label} ({fw.value})</option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center border-r border-gray-200 pr-1.5 mr-0.5 gap-0.5">
            <button
              onClick={() => updateStyle('fontSize', Math.max(8, (element.style?.fontSize || 16) - 2))}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-[6px] text-gray-600 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <FontSizeInput value={element.style?.fontSize || 16} onChange={(v) => updateStyle('fontSize', v)} />
            <button
              onClick={() => updateStyle('fontSize', Math.min(200, (element.style?.fontSize || 16) + 2))}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-[6px] text-gray-600 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center border-r border-gray-200 pr-1.5 mr-0.5 gap-0.5">
            {([
              { align: 'left' as const, icon: AlignLeft },
              { align: 'center' as const, icon: AlignCenter },
              { align: 'right' as const, icon: AlignRight },
            ] as const).map(({ align, icon: Icon }) => (
              <button
                key={align}
                onClick={() => updateStyle('textAlign', align)}
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-[6px] hover:bg-gray-100 cursor-pointer transition-colors",
                  element.style?.textAlign === align && "bg-orange-50 text-[#FF6000]"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Text Color (global theme — applies to graphics, logos, text) */}
          <div className="flex items-center border-r border-gray-200 pr-1.5 mr-0.5 gap-0.5">
            <button
              onClick={() => setThemeColor('#000000')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-[6px] cursor-pointer transition-colors border",
                themeColor.toUpperCase() === '#000000' ? "border-[#FF6000] bg-orange-50" : "border-gray-200 hover:bg-gray-50"
              )}
              title="블랙"
            >
              <div className="w-4 h-4 rounded-full bg-black" />
            </button>
            <button
              onClick={() => setThemeColor('#FFFFFF')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-[6px] cursor-pointer transition-colors border",
                themeColor.toUpperCase() === '#FFFFFF' ? "border-[#FF6000] bg-orange-50" : "border-gray-200 hover:bg-gray-50"
              )}
              title="화이트"
            >
              <div className="w-4 h-4 rounded-full bg-white border border-gray-300" />
            </button>
          </div>
        </>
      )}

      {/* Common: Duplicate + Delete */}
      <div className="flex items-center gap-0.5">
        <button onClick={() => duplicateElement(selectedId)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-[6px] text-gray-500 hover:text-blue-600 cursor-pointer" title="복제">
          <Copy className="w-4 h-4" />
        </button>
        <button onClick={() => removeElements([selectedId])} className="w-6 h-6 flex items-center justify-center hover:bg-red-50 rounded-[6px] text-red-400 hover:text-red-600 cursor-pointer" title="삭제">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════
export const ContextToolbar = ({ isMobile }: { isMobile?: boolean }) => {
  const { selectedIds, elements } = useEditorStore();

  if (selectedIds.length !== 1) return null;
  const element = elements.find(el => el.id === selectedIds[0]);
  if (!element) return null;

  if (isMobile) {
    return element.type === 'text' ? <MobileTextToolbar /> : <MobileGraphicToolbar />;
  }
  return <DesktopToolbar />;
};