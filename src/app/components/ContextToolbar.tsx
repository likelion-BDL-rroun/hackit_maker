import { useEditorStore } from '../store/useEditorStore';
import {
  Trash2, Copy, AlignLeft, AlignCenter, AlignRight,
  MoreHorizontal,
  Minus, Plus, Type as TypeIcon,
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
      className="bg-white shadow-xl rounded-[12px] border border-gray-100 p-1.5 flex items-center gap-1"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <button onClick={() => duplicateElement(selectedId)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 active:bg-gray-100 rounded-[6px] text-gray-500 hover:text-blue-600 cursor-pointer" title="복제">
        <Copy className="w-4 h-4" />
      </button>
      <button onClick={() => removeElements([selectedId])} className="w-6 h-6 flex items-center justify-center hover:bg-red-50 active:bg-red-50 rounded-[6px] text-gray-500 hover:text-red-600 cursor-pointer" title="삭제">
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

type TextMenuFeature = 'fontStyle' | 'align';

// ─── Level 3: Detail card ───
const TextDetailCard = ({
  feature,
  onClose,
}: {
  feature: TextMenuFeature;
  onClose: () => void;
}) => {
  const { selectedIds, elements, updateElement } = useEditorStore();
  const selectedId = selectedIds[0];
  const element = elements.find(el => el.id === selectedId);
  if (!element || element.type !== 'text') return null;

  const updateStyle = (key: string, value: any) => {
    updateElement(selectedId, { style: { ...element.style, [key]: value } });
  };

  const fontSize = element.style?.fontSize || 16;
  const fontWeight = element.style?.fontWeight || 400;
  const textAlign = element.style?.textAlign || 'left';

  return (
    <div
      className="fixed z-[1000] left-4 right-4 bg-white rounded-[20px] px-4 py-3.5"
      style={{
        bottom: 'calc(56px + 16px + 8px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        animation: 'detailCardIn 0.2s ease-out',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Font style list */}
      {feature === 'fontStyle' && (
        <div className="space-y-1 max-h-[240px] overflow-y-auto">
          {FONT_WEIGHTS.map(fw => (
            <button
              key={fw.value}
              onClick={() => updateStyle('fontWeight', fw.value)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] transition-colors cursor-pointer",
                fontWeight === fw.value
                  ? "bg-[#FF6000]/10 text-[#FF6000]"
                  : "text-gray-700 active:bg-gray-50"
              )}
            >
              <span style={{ fontSize: '14px', fontWeight: fw.value, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                {fw.label}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 500 }} className="text-gray-400">
                {fw.value}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Alignment toggle */}
      {feature === 'align' && (
        <div className="flex gap-2">
          {([
            { align: 'left' as const, icon: AlignLeft, label: '좌측' },
            { align: 'center' as const, icon: AlignCenter, label: '가운데' },
            { align: 'right' as const, icon: AlignRight, label: '우측' },
          ]).map(({ align, icon: Icon, label }) => (
            <button
              key={align}
              onClick={() => updateStyle('textAlign', align)}
              className={cn(
                "flex-1 h-12 flex items-center justify-center gap-2 rounded-[14px] transition-colors cursor-pointer",
                textAlign === align
                  ? "bg-[#FF6000] text-white"
                  : "bg-gray-100 text-gray-600 active:bg-gray-200"
              )}
            >
              <Icon className="w-5 h-5" />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{label}</span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
};

// ─── Level 2: Bottom pill bar ───
const TextBottomBar = ({
  activeFeature,
  onSelectFeature,
}: {
  activeFeature: TextMenuFeature | null;
  onSelectFeature: (f: TextMenuFeature | null) => void;
}) => {
  const features: { id: TextMenuFeature; icon: React.ElementType; label: string }[] = [
    { id: 'fontStyle', icon: TypeIcon, label: '스타일' },
    { id: 'align', icon: AlignCenter, label: '정렬' },
  ];

  return (
    <div
      className="fixed z-[1000] left-4 right-4 h-[56px] bg-white rounded-[28px] flex items-center justify-around px-3"
      style={{
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        animation: 'bottomBarSlideIn 0.2s ease',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {features.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onSelectFeature(activeFeature === id ? null : id)}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-[48px] rounded-[16px] transition-colors cursor-pointer",
            activeFeature === id
              ? "bg-[#FF6000]/10 text-[#FF6000]"
              : "text-gray-500 active:bg-gray-100"
          )}
        >
          <Icon className="w-5 h-5" />
          <span style={{ fontSize: '10px', fontWeight: activeFeature === id ? 700 : 500 }}>{label}</span>
        </button>
      ))}
    </div>
  );
};

// ─── Level 1: Floating toolbar (4 buttons only) ───
const MobileTextToolbar = () => {
  const {
    selectedIds, elements, updateElement, removeElements, duplicateElement,
    mobileTextMenuOpen, setMobileTextMenuOpen,
  } = useEditorStore();

  const [activeFeature, setActiveFeature] = useState<TextMenuFeature | null>(null);

  const selectedId = selectedIds[0];
  const element = elements.find(el => el.id === selectedId);

  // Clean up when unmounted or deselected
  useEffect(() => {
    return () => {
      setMobileTextMenuOpen(false);
    };
  }, [setMobileTextMenuOpen]);

  // Close feature when menu closes
  useEffect(() => {
    if (!mobileTextMenuOpen) setActiveFeature(null);
  }, [mobileTextMenuOpen]);

  if (!element || element.type !== 'text') return null;

  const updateStyle = (key: string, value: any) => {
    updateElement(selectedId, { style: { ...element.style, [key]: value } });
  };

  const fontSize = element.style?.fontSize || 16;

  const handleMenuToggle = () => {
    const next = !mobileTextMenuOpen;
    setMobileTextMenuOpen(next);
    if (!next) setActiveFeature(null);
  };

  return (
    <>
      {/* ── Level 1: Floating toolbar ── */}
      <div
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
          className="w-6 h-6 flex items-center justify-center rounded-[6px] text-gray-500 hover:bg-red-50 active:bg-red-50 active:text-red-500 cursor-pointer"
          title="삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        {/* Menu "…" */}
        <button
          onClick={handleMenuToggle}
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded-[6px] cursor-pointer transition-colors",
            mobileTextMenuOpen
              ? "bg-[#FF6000]/10 text-[#FF6000]"
              : "text-gray-500 hover:bg-gray-100 active:bg-gray-100"
          )}
          title="메뉴"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* ── Level 2: Bottom pill bar (portaled to escape stacking context) ── */}
      {mobileTextMenuOpen && createPortal(
        <TextBottomBar
          activeFeature={activeFeature}
          onSelectFeature={setActiveFeature}
        />,
        document.body,
      )}

      {/* ── Level 3: Detail card (portaled to escape stacking context) ── */}
      {mobileTextMenuOpen && activeFeature && createPortal(
        <TextDetailCard
          feature={activeFeature}
          onClose={() => setActiveFeature(null)}
        />,
        document.body,
      )}

      {/* Animations */}
      <style>{`
        @keyframes bottomBarSlideIn {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes detailCardIn {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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
    <div className="bg-white shadow-xl rounded-[12px] border border-gray-100 p-1.5 flex items-center gap-1 z-50" style={{ animation: 'fadeIn 0.15s ease-out' }}>
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
        <button onClick={() => removeElements([selectedId])} className="w-6 h-6 flex items-center justify-center hover:bg-red-50 rounded-[6px] text-gray-500 hover:text-red-600 cursor-pointer" title="삭제">
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