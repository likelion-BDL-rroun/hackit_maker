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
  title, children, width, height,
}: {
  title: string;
  children: React.ReactNode;
  width?: number;
  height?: number;
}) => (
  <div
    className="bg-[#FCFCFD] rounded-[20px] border border-[#E5E7EB] p-5 overflow-hidden flex flex-col shrink-0"
    style={{ ...(width ? { width } : {}), ...(height ? { height } : {}) }}
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
  const engLogo = BRAND_LOGOS.find((l) => l.name === 'LIKELION') || BRAND_LOGOS[0];

  return (
    <div
      className="flex flex-col shrink-0 gap-3"
      style={{ width: 296 }}
    >
      {/* ── 캔버스 Card ────────────────────────── */}
      <Card title="캔버스" width={296} height={324}>
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
          <SubLabel>컬러</SubLabel>
          <div className="flex items-center gap-2">
            {CANVAS_COLORS.map((c) => {
              const isWhite = c.toUpperCase() === '#FFFFFF';
              const isActive = backgroundColor.toUpperCase() === c.toUpperCase();
              const needsDarkCheck = c.toUpperCase() === '#FFFFFF' || c.toUpperCase() === '#FFE066' || c.toUpperCase() === '#F2EDE6';
              return (
                <button
                  key={c}
                  onClick={() => handleCanvasColorChange(c)}
                  className="transition-all duration-150 cursor-pointer shrink-0 flex items-center justify-center"
                  style={{
                    width: isActive ? 36 : 24,
                    height: isActive ? 36 : 24,
                    borderRadius: 4,
                    backgroundColor: c,
                    boxShadow: isWhite
                      ? 'inset 0 0 0 1px #E5E7EB'
                      : '0 0 0 1px rgba(0,0,0,0.06)',
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
        <div className="flex flex-col gap-2">
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
      <Card title="로고" width={296} height={164}>
        <div>
          {/* Column headers */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>국문</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>영문</span>
          </div>

          {/* Logo buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAddLogo(korLogo)}
              className="flex items-center justify-center px-3 py-2.5 rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
              title={korLogo.name}
            >
              <div
                style={{
                  height: 20,
                  width: Math.round((korLogo.defaultWidth ?? 280) * (20 / (korLogo.defaultHeight ?? 80))),
                  backgroundColor: themeColor,
                  WebkitMaskImage: `url(${korLogo.imageUrl})`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: `url(${korLogo.imageUrl})`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                }}
              />
            </button>

            <button
              onClick={() => handleAddLogo(engLogo)}
              className="flex items-center justify-center px-3 py-2.5 rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
              title={engLogo.name}
            >
              <div
                style={{
                  height: 20,
                  width: Math.round((engLogo.defaultWidth ?? 300) * (20 / (engLogo.defaultHeight ?? 60))),
                  backgroundColor: themeColor,
                  WebkitMaskImage: `url(${engLogo.imageUrl})`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: `url(${engLogo.imageUrl})`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                }}
              />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
