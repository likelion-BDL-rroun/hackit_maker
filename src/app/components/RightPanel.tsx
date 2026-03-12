import React from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { FORMATS, FormatType } from '../store/types';
import { BRAND_LOGOS } from '../store/graphics';
import { cn } from '../../lib/utils';
import { CANVAS_ASSET_COLOR_MAP } from './LeftPanel';

// Canvas background color presets
const CANVAS_COLORS = ['#000000', '#FFFFFF', '#FF6000', '#F2EDE6', '#FFE066'];

// ─── Checkmark SVG ─────────────────────────────────────────────────────────────
const CheckIcon = ({ dark }: { dark?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7L6 10L11 4" stroke={dark ? '#1D1D1F' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Toggle switch ─────────────────────────────────────────────────────────────
const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={cn(
      'w-10 h-6 rounded-full transition-colors relative cursor-pointer shrink-0',
      enabled ? 'bg-[#FF6000]' : 'bg-gray-200',
    )}
  >
    <div
      className={cn(
        'bg-white rounded-full absolute w-4 h-4 top-1 transition-all shadow-sm',
        enabled ? 'left-5' : 'left-1',
      )}
    />
  </button>
);

// ─── Card container ────────────────────────────────────────────────────────────
const Card = ({
  title, children, width,
}: {
  title: string;
  children: React.ReactNode;
  width?: number;
}) => (
  <div
    className="bg-[#FCFCFD] rounded-[20px] border border-[#E5E7EB] p-5 flex flex-col shrink-0"
    style={{ ...(width ? { width } : {}) }}
  >
    <span style={{ fontSize: 12, fontWeight: 600, color: '#969696' }}>{title}</span>
    <div className="mt-4 flex flex-col gap-5">
      {children}
    </div>
  </div>
);

// ─── Sub-label ─────────────────────────────────────────────────────────────────
const SubLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }} className="mb-2">{children}</p>
);

// ─── Right Panel ───────────────────────────────────────────────────────────────
export const RightPanel = () => {
  const {
    format, setFormat,
    backgroundColor, setBackgroundColor,
    themeColor, setThemeColor,
    showMargins, toggleMargins,
    addElement,
  } = useEditorStore();

  const isA3 = format === 'A3';
  const canvasW = FORMATS[format].width;
  const canvasH = FORMATS[format].height;
  const sizeMultiplier = isA3 ? 4 : 1;

  // ── Change canvas color + auto-update asset color ────────────────────────────
  const handleCanvasColorChange = (color: string) => {
    setBackgroundColor(color);
    const mapping = CANVAS_ASSET_COLOR_MAP[color.toUpperCase()];
    if (mapping) {
      const inPalette = mapping.some((c) => c.toUpperCase() === themeColor.toUpperCase());
      if (!inPalette) setThemeColor(mapping[0]);
    }
  };

  // ── Add logo ─────────────────────────────────────────────────────────────────
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

  // Logo groups: 국문 and 영문
  const korLogo = BRAND_LOGOS.find((l) => l.name === '멋사대학') || BRAND_LOGOS[1];
  const engLogo = BRAND_LOGOS.find((l) => l.name === 'LIKELION UNIV.') || BRAND_LOGOS[0];

  return (
    <div
      className="flex flex-col shrink-0 gap-3"
      style={{ width: 296 }}
    >
      {/* ── 캔버스 Card ────────────────────────── */}
      <Card title="캔버스" width={296}>
        {/* 비율 */}
        <div>
          <SubLabel>비율</SubLabel>
          <div className="flex gap-2">
            {(Object.keys(FORMATS) as FormatType[]).map((f) => (
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

        {/* 컬러 */}
        <div>
          <SubLabel>배경 컬러</SubLabel>
          <div className="flex items-center gap-2" style={{ height: 36 }}>
            {CANVAS_COLORS.map((c) => {
              const isWhite = c.toUpperCase() === '#FFFFFF';
              const isActive = backgroundColor.toUpperCase() === c.toUpperCase();
              const needsDarkCheck = c.toUpperCase() === '#FFFFFF' || c.toUpperCase() === '#FFE066' || c.toUpperCase() === '#F2EDE6';
              const size = isActive ? 32 : 24;
              return (
                <button
                  key={c}
                  onClick={() => handleCanvasColorChange(c)}
                  className="cursor-pointer shrink-0 flex items-center justify-center"
                  style={{
                    width: size,
                    height: size,
                    borderRadius: 4,
                    backgroundColor: c,
                    boxShadow: isActive
                      ? (isWhite ? 'inset 0 0 0 1px #E5E7EB, 0 0 0 2px #FF6000' : '0 0 0 2px #FF6000')
                      : (isWhite ? 'inset 0 0 0 1px #E5E7EB' : '0 0 0 1px rgba(0,0,0,0.06)'),
                  }}
                  title={c}
                >
                  {isActive && <CheckIcon dark={needsDarkCheck} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 여백 가이드 */}
        <div className="flex flex-col">
          <SubLabel>여백 가이드</SubLabel>
          <div className="flex items-center gap-2">
            <ToggleSwitch enabled={showMargins} onToggle={toggleMargins} />
            <span style={{ fontSize: 12, fontWeight: 500, color: showMargins ? '#FF6000' : '#969696' }}>
              {showMargins ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </Card>

      {/* ── 로고 Card ──────────────────────────── */}
      <Card title="로고" width={296}>
        <div>
          {/* Column headers — 버튼 너비와 동일하게 맞춰 좌측 정렬 */}
          <div className="flex mb-2" style={{ gap: 24 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', width: 68 }}>국문</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', width: 122 }}>영문</span>
          </div>

          {/* Logo buttons — 텍스트 표시, 클릭 시 캔버스에 로고 추가 */}
          <div className="flex" style={{ gap: 24 }}>
            <button
              onClick={() => handleAddLogo(korLogo)}
              className="flex items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-[#F5F6F8] hover:bg-[#EDEEF1] transition-all cursor-pointer shrink-0"
              style={{ width: 68, height: 40 }}
              title={korLogo.name}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: themeColor }}>
                {korLogo.name}
              </span>
            </button>

            <button
              onClick={() => handleAddLogo(engLogo)}
              className="flex items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-[#F5F6F8] hover:bg-[#EDEEF1] transition-all cursor-pointer shrink-0"
              style={{ width: 122, height: 40 }}
              title={engLogo.name}
            >
              <span
                className="text-center leading-tight"
                style={{ fontSize: 14, fontWeight: 700, color: themeColor }}
              >
                {engLogo.name}
              </span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
