import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { Type as TypeIcon } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';
import { FORMATS, FormatType } from '../store/types';
import { GRAPHICS, BRAND_LOGOS } from '../store/graphics';
import { cn } from '../../lib/utils';
import {
  CANVAS_ASSET_COLOR_MAP,
  FULL_PALETTE,
  RANDOM_LAYOUTS,
} from './LeftPanel';

// ─── Canvas background color presets ───────────────────────────────────────
const CANVAS_COLORS = ['#000000', '#FFFFFF', '#FF6000', '#F2EDE6', '#FFE066'];

// ─── Tiny utils (same logic as LeftPanel) ──────────────────────────────────
const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickUnique = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
};

// ─── Shared small components ────────────────────────────────────────────────
const CheckIcon = ({ dark }: { dark?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M3 7L6 10L11 4" stroke={dark ? '#1D1D1F' : 'white'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={cn('w-10 h-6 rounded-full transition-colors relative cursor-pointer shrink-0', enabled ? 'bg-[#FF6000]' : 'bg-gray-200')}
  >
    <div className={cn('bg-white rounded-full absolute w-4 h-4 top-1 transition-all shadow-sm', enabled ? 'left-5' : 'left-1')} />
  </button>
);

const DotIcon = ({ count }: { count: 1 | 3 | 9 }) => {
  if (count === 1) return (
    <div className="flex items-center justify-center w-8 h-8">
      <div className="w-3 h-3 rounded-full bg-gray-400" />
    </div>
  );
  if (count === 3) return (
    <div className="flex items-center justify-center gap-1.5 w-8 h-8">
      {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-gray-400" />)}
    </div>
  );
  return (
    <div className="grid grid-cols-3 gap-[3px] items-center justify-items-center w-8 h-8">
      {Array.from({ length: 9 }).map((_, i) => <div key={i} className="w-[6px] h-[6px] rounded-full bg-gray-400" />)}
    </div>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-2" style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>{children}</h3>
);

// ─── Tab types ──────────────────────────────────────────────────────────────
type MobileTab = '에셋' | '캔버스' | '로고';

const SHEET_HEIGHT = 260;
const TAB_BAR_HEIGHT = 48;

// ─── MobileBottomPanel ──────────────────────────────────────────────────────
export const MobileBottomPanel = () => {
  const [activeTab, setActiveTab] = useState<MobileTab>('에셋');
  const [isOpen, setIsOpen] = useState(false);

  const {
    format, setFormat,
    backgroundColor, setBackgroundColor,
    themeColor, setThemeColor,
    showMargins, toggleMargins,
    addElement, setAllElements,
  } = useEditorStore();

  const isA3 = format === 'A3';
  const canvasW = FORMATS[format].width;
  const canvasH = FORMATS[format].height;
  const sizeMultiplier = isA3 ? 4 : 1;

  // Compute available asset colors based on background
  const bgKey = backgroundColor.toUpperCase();
  const mappedKey = Object.keys(CANVAS_ASSET_COLOR_MAP).find(k => k.toUpperCase() === bgKey);
  const availableColors = mappedKey ? CANVAS_ASSET_COLOR_MAP[mappedKey] : FULL_PALETTE;

  // ── Random layout ──────────────────────────────────────────────────────────
  const handleRandom = (count: 1 | 3 | 9) => {
    const type = count === 1 ? 'A' : count === 3 ? 'B' : 'C';
    const cfg = RANDOM_LAYOUTS[format]?.[type] ?? RANDOM_LAYOUTS['1:1'][type];
    const newElements: Parameters<typeof setAllElements>[0] = [];

    // Logo
    const logoGraphic = GRAPHICS.find(g => g.name === '멋사 심볼');
    if (logoGraphic) {
      const lw = 60 * sizeMultiplier;
      const lh = 60 * sizeMultiplier;
      newElements.push({
        id: nanoid(), type: 'graphic',
        x: Math.round((canvasW - lw) / 2), y: cfg.logoTop,
        width: lw, height: lh, rotation: 0, visible: true, locked: false,
        graphicName: logoGraphic.name, style: { color: themeColor },
        content: logoGraphic.path, imageUrl: logoGraphic.imageUrl,
      });
    }

    // Graphics (no duplicates)
    const symbolGraphics = GRAPHICS.filter(g => !g.isLogo);
    const picked = pickUnique(symbolGraphics, count);

    if (type === 'A') {
      const g = picked[0];
      newElements.push({
        id: nanoid(), type: 'graphic',
        x: cfg.gfxLeft, y: cfg.gfxTop,
        width: cfg.gfxW, height: cfg.gfxH,
        rotation: 0, visible: true, locked: false,
        graphicName: g.name, style: { color: pickRandom(availableColors) },
        content: g.path, imageUrl: g.imageUrl,
      });
    } else if (type === 'B') {
      for (let i = 0; i < 3; i++) {
        const g = picked[i];
        newElements.push({
          id: nanoid(), type: 'graphic',
          x: cfg.gfxLeft + i * (cfg.gfxW + cfg.gfxGapX), y: cfg.gfxTop,
          width: cfg.gfxW, height: cfg.gfxH,
          rotation: 0, visible: true, locked: false,
          graphicName: g.name, style: { color: pickRandom(availableColors) },
          content: g.path, imageUrl: g.imageUrl,
        });
      }
    } else {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const g = picked[row * 3 + col];
          newElements.push({
            id: nanoid(), type: 'graphic',
            x: cfg.gfxLeft + col * (cfg.gfxW + cfg.gfxGapX),
            y: cfg.gfxTop + row * (cfg.gfxH + cfg.gfxGapY),
            width: cfg.gfxW, height: cfg.gfxH,
            rotation: 0, visible: true, locked: false,
            graphicName: g.name, style: { color: pickRandom(availableColors) },
            content: g.path, imageUrl: g.imageUrl,
          });
        }
      }
    }

    // Texts
    const fontSize = format === 'A3' ? 220 : 72;
    newElements.push({
      id: nanoid(), type: 'text',
      x: 0, y: cfg.textY1, width: canvasW, height: Math.round(fontSize * 1.3),
      rotation: 0, visible: true, locked: false, content: 'LIKELION UNIV.',
      style: { fontSize, fontWeight: 800, color: themeColor, textAlign: 'center' },
    });
    newElements.push({
      id: nanoid(), type: 'text',
      x: 0, y: cfg.textY2, width: canvasW, height: Math.round(fontSize * 1.3),
      rotation: 0, visible: true, locked: false, content: '14TH HACKATHON',
      style: { fontSize, fontWeight: 800, color: themeColor, textAlign: 'center' },
    });

    setAllElements(newElements);
  };

  // ── Add graphic ────────────────────────────────────────────────────────────
  const handleAddGraphic = (graphic: typeof GRAPHICS[0]) => {
    const w = (graphic.defaultWidth ?? 200) * sizeMultiplier;
    const h = (graphic.defaultHeight ?? w) * sizeMultiplier;
    addElement({
      type: 'graphic',
      x: Math.round((canvasW - w) / 2), y: Math.round((canvasH - h) / 2),
      width: w, height: h, rotation: 0,
      graphicName: graphic.name, style: { color: themeColor },
      content: graphic.path, imageUrl: graphic.imageUrl,
    });
  };

  // ── Add text ───────────────────────────────────────────────────────────────
  const handleAddText = () => {
    const fontSize = 60 * sizeMultiplier;
    const w = Math.round(canvasW * 0.6);
    const h = Math.round(fontSize * 1.4);
    addElement({
      type: 'text',
      x: Math.round((canvasW - w) / 2), y: Math.round((canvasH - h) / 2),
      width: w, height: h, rotation: 0,
      content: '텍스트를 입력하세요',
      style: { fontSize, fontWeight: 700, color: themeColor, textAlign: 'center' },
    });
  };

  // ── Canvas color ───────────────────────────────────────────────────────────
  const handleCanvasColorChange = (color: string) => {
    setBackgroundColor(color);
    const mapping = CANVAS_ASSET_COLOR_MAP[color.toUpperCase()];
    if (mapping) {
      const inPalette = mapping.some(c => c.toUpperCase() === themeColor.toUpperCase());
      if (!inPalette) setThemeColor(mapping[0]);
    }
  };

  // ── Logo ───────────────────────────────────────────────────────────────────
  const korLogo = BRAND_LOGOS.find(l => l.name === '멋사대학') || BRAND_LOGOS[1];
  const engLogo = BRAND_LOGOS.find(l => l.name === 'LIKELION UNIV.') || BRAND_LOGOS[0];

  const handleAddLogo = (logo: typeof BRAND_LOGOS[0]) => {
    const w = (logo.defaultWidth ?? 300) * sizeMultiplier;
    const h = (logo.defaultHeight ?? 60) * sizeMultiplier;
    addElement({
      type: 'graphic',
      x: Math.round((canvasW - w) / 2), y: Math.round((canvasH - h) / 2),
      width: w, height: h, rotation: 0,
      graphicName: logo.name, style: { color: themeColor },
      content: logo.path, imageUrl: logo.imageUrl, isLogo: true,
    });
  };

  const symbolGraphics = GRAPHICS.filter(g => !g.isLogo);

  const handleTabClick = (tab: MobileTab) => {
    if (isOpen && activeTab === tab) {
      setIsOpen(false);
    } else {
      setActiveTab(tab);
      setIsOpen(true);
    }
  };

  return (
    // Absolutely positioned at bottom of parent canvas container
    <div className="absolute bottom-0 left-0 right-0 flex flex-col" style={{ zIndex: 20 }}>

      {/* ── Sheet content — slides up from below, behind tab bar ─────────────── */}
      <div
        className="overflow-y-auto"
        style={{
          height: SHEET_HEIGHT,
          transform: isOpen ? 'translateY(0)' : `translateY(${SHEET_HEIGHT}px)`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
          zIndex: 1,
          position: 'relative',
          background: 'rgba(252, 252, 253, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '20px 20px 0 0',
        }}
      >

        {/* ═══ 에셋 ═══ */}
        {activeTab === '에셋' && (
          <div className="flex flex-col gap-4">

            {/* 랜덤 */}
            <div>
              <SectionTitle>랜덤</SectionTitle>
              <div className="flex gap-2">
                {([1, 3, 9] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => handleRandom(n)}
                    className="flex-1 flex items-center justify-center rounded-[10px] bg-[#F5F6F8] hover:bg-[#EDEEF1] border border-[#E5E7EB] transition-all cursor-pointer active:scale-[0.97]"
                    style={{ height: 56 }}
                  >
                    <DotIcon count={n} />
                  </button>
                ))}
              </div>
            </div>

            {/* 에셋 컬러 */}
            <div>
              <SectionTitle>에셋 컬러</SectionTitle>
              <div className="flex flex-wrap gap-2 items-center" style={{ minHeight: 36 }}>
                {availableColors.map(c => {
                  const isWhite = c.toUpperCase() === '#FFFFFF';
                  const isActive = themeColor.toUpperCase() === c.toUpperCase();
                  const size = isActive ? 32 : 24;
                  return (
                    <button
                      key={c}
                      onClick={() => setThemeColor(c)}
                      className="rounded-full cursor-pointer shrink-0 flex items-center justify-center"
                      style={{
                        width: size, height: size, backgroundColor: c,
                        boxShadow: isActive
                          ? (isWhite ? 'inset 0 0 0 1px #E5E7EB, 0 0 0 2px #FF6000' : '0 0 0 2px #FF6000')
                          : (isWhite ? 'inset 0 0 0 1px #E5E7EB' : '0 0 0 1px rgba(0,0,0,0.06)'),
                      }}
                    >
                      {isActive && <CheckIcon dark={isWhite} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 그래픽 — horizontal scroll */}
            <div>
              <SectionTitle>그래픽</SectionTitle>
              <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
                {symbolGraphics.map((g, i) => (
                  <button
                    key={`${g.name}-${i}`}
                    onClick={() => handleAddGraphic(g)}
                    className="flex items-center justify-center shrink-0 rounded-[10px] bg-[#F5F6F8] hover:bg-[#EDEEF1] border border-[#E5E7EB] transition-all cursor-pointer p-2 active:scale-[0.97]"
                    style={{ width: 60, height: 60 }}
                    title={g.name}
                  >
                    {g.imageUrl ? (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: themeColor,
                          WebkitMaskImage: `url(${g.imageUrl})`,
                          WebkitMaskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskImage: `url(${g.imageUrl})`,
                          maskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          maskPosition: 'center',
                        }}
                      />
                    ) : (
                      <svg viewBox={g.viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                        <path d={g.path} fill={themeColor} />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 텍스트 추가 */}
            <button
              onClick={handleAddText}
              className="flex items-center justify-center gap-2 rounded-[10px] bg-[#FF6000] hover:bg-[#E55600] text-white transition-all cursor-pointer active:scale-[0.98] w-full"
              style={{ height: 40, fontSize: 14, fontWeight: 600 }}
            >
              <TypeIcon className="w-4 h-4" />
              텍스트 추가
            </button>
          </div>
        )}

        {/* ═══ 캔버스 ═══ */}
        {activeTab === '캔버스' && (
          <div className="flex flex-col gap-4">

            {/* 비율 */}
            <div>
              <SectionTitle>비율</SectionTitle>
              <div className="flex gap-2">
                {(Object.keys(FORMATS) as FormatType[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      'flex items-center justify-center rounded-[8px] border transition-all cursor-pointer',
                      format === f
                        ? 'border-[#FF6000] bg-orange-50 text-[#FF6000]'
                        : 'border-[#E5E7EB] bg-[#F5F6F8] hover:bg-[#EDEEF1] text-gray-600',
                    )}
                    style={{ width: 56, height: 40, fontSize: 13, fontWeight: format === f ? 700 : 500 }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* 배경 컬러 */}
            <div>
              <SectionTitle>배경 컬러</SectionTitle>
              <div className="flex items-center gap-2" style={{ height: 36 }}>
                {CANVAS_COLORS.map(c => {
                  const isWhite = c.toUpperCase() === '#FFFFFF';
                  const isActive = backgroundColor.toUpperCase() === c.toUpperCase();
                  const needsDarkCheck = ['#FFFFFF', '#FFE066', '#F2EDE6'].includes(c.toUpperCase());
                  const size = isActive ? 32 : 24;
                  return (
                    <button
                      key={c}
                      onClick={() => handleCanvasColorChange(c)}
                      className="cursor-pointer shrink-0 flex items-center justify-center"
                      style={{
                        width: size, height: size, borderRadius: 4, backgroundColor: c,
                        boxShadow: isActive
                          ? (isWhite ? 'inset 0 0 0 1px #E5E7EB, 0 0 0 2px #FF6000' : '0 0 0 2px #FF6000')
                          : (isWhite ? 'inset 0 0 0 1px #E5E7EB' : '0 0 0 1px rgba(0,0,0,0.06)'),
                      }}
                    >
                      {isActive && <CheckIcon dark={needsDarkCheck} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 여백 가이드 */}
            <div>
              <SectionTitle>여백 가이드</SectionTitle>
              <div className="flex items-center gap-2">
                <ToggleSwitch enabled={showMargins} onToggle={toggleMargins} />
                <span style={{ fontSize: 12, fontWeight: 500, color: showMargins ? '#FF6000' : '#969696' }}>
                  {showMargins ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ 로고 ═══ */}
        {activeTab === '로고' && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex flex-col gap-2 items-center">
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>국문</span>
                <button
                  onClick={() => handleAddLogo(korLogo)}
                  className="flex items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-[#F5F6F8] hover:bg-[#EDEEF1] transition-all cursor-pointer active:scale-[0.97]"
                  style={{ width: 80, height: 48 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: themeColor }}>{korLogo.name}</span>
                </button>
              </div>
              <div className="flex flex-col gap-2 flex-1 items-center">
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>영문</span>
                <button
                  onClick={() => handleAddLogo(engLogo)}
                  className="flex items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-[#F5F6F8] hover:bg-[#EDEEF1] transition-all cursor-pointer active:scale-[0.97] w-full"
                  style={{ height: 48 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: themeColor }}>{engLogo.name}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab bar — always on top, solid background ───────────────────────── */}
      <div
        className="flex shrink-0 bg-[#FCFCFD] border-t border-[#E5E7EB]"
        style={{ height: TAB_BAR_HEIGHT, position: 'relative', zIndex: 2 }}
      >
        {(['에셋', '캔버스', '로고'] as MobileTab[]).map(tab => {
          const isActive = isOpen && activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className="flex-1 flex items-center justify-center relative cursor-pointer transition-colors"
              style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#FF6000' : '#969696' }}
            >
              {tab}
              {isActive && (
                <div className="absolute top-0 left-4 right-4 h-[2px] bg-[#FF6000] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
