import React from 'react';
import { nanoid } from 'nanoid';
import { Type as TypeIcon } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';
import { FORMATS } from '../store/types';
import { GRAPHICS, BRAND_LOGOS } from '../store/graphics';
import type { EditorElement } from '../store/types';

// ─── Canvas-mapped asset colors ───────────────────────────────────────────────
export const CANVAS_ASSET_COLOR_MAP: Record<string, string[]> = {
  '#F2EDE6': ['#D20001', '#212842', '#5A2828', '#044340', '#FF7000', '#000000'],
  '#FFE066': ['#F52D2D', '#194BDA', '#0B7027', '#8725AE', '#FF7000', '#000000'],
  '#FFFFFF': ['#16A982', '#5C30FF', '#FF277F', '#2F2268', '#FF7000', '#000000'],
  '#000000': ['#00F5FF', '#00FF95', '#D7FF00', '#FF00C8', '#FF7000', '#FFFFFF'],
  '#FF6000': ['#020035', '#052D29', '#260B42', '#3C0B0B', '#000000', '#FFFFFF'],
};

const FULL_PALETTE = [
  '#FFFFFF', '#FF6000', '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
  '#00C7BE', '#30B0C7', '#007AFF', '#5856D6', '#AF52DE',
  '#FF2D55', '#1D1D1F', '#636366', '#8E8E93',
];

// ─── Random layout configs (absolute px per format, per type) ─────────────────
type RLayoutEntry = {
  logoTop: number;
  gfxW: number; gfxH: number; gfxTop: number; gfxLeft: number;
  gfxGapX: number; gfxGapY: number;
  textY1: number; textY2: number;
};
const RANDOM_LAYOUTS: Record<string, { A: RLayoutEntry; B: RLayoutEntry; C: RLayoutEntry }> = {
  '1:1': {
    A: { logoTop: 80,  gfxW: 500, gfxH: 500, gfxTop: 222,  gfxLeft: 290, gfxGapX: 0,  gfxGapY: 0,  textY1: 800, textY2: 872 },
    B: { logoTop: 80,  gfxW: 280, gfxH: 280, gfxTop: 342,  gfxLeft: 100, gfxGapX: 20, gfxGapY: 0,  textY1: 800, textY2: 872 },
    C: { logoTop: 80,  gfxW: 188, gfxH: 188, gfxTop: 180,  gfxLeft: 242, gfxGapX: 16, gfxGapY: 16, textY1: 800, textY2: 872 },
  },
  '4:5': {
    A: { logoTop: 135, gfxW: 500, gfxH: 500, gfxTop: 359,  gfxLeft: 290, gfxGapX: 0,  gfxGapY: 0,  textY1: 978, textY2: 1060 },
    B: { logoTop: 135, gfxW: 280, gfxH: 280, gfxTop: 476,  gfxLeft: 100, gfxGapX: 20, gfxGapY: 0,  textY1: 978, textY2: 1060 },
    C: { logoTop: 135, gfxW: 200, gfxH: 200, gfxTop: 302,  gfxLeft: 224, gfxGapX: 16, gfxGapY: 16, textY1: 978, textY2: 1060 },
  },
  '9:16': {
    A: { logoTop: 250, gfxW: 520, gfxH: 520, gfxTop: 568,  gfxLeft: 280, gfxGapX: 0,  gfxGapY: 0,  textY1: 1400, textY2: 1480 },
    B: { logoTop: 250, gfxW: 300, gfxH: 300, gfxTop: 678,  gfxLeft: 74,  gfxGapX: 16, gfxGapY: 0,  textY1: 1400, textY2: 1480 },
    C: { logoTop: 250, gfxW: 240, gfxH: 240, gfxTop: 464,  gfxLeft: 164, gfxGapX: 16, gfxGapY: 16, textY1: 1400, textY2: 1480 },
  },
  'A3': {
    A: { logoTop: 533, gfxW: 1560, gfxH: 1560, gfxTop: 1546, gfxLeft: 974, gfxGapX: 0,  gfxGapY: 0,  textY1: 3700, textY2: 3932 },
    B: { logoTop: 533, gfxW: 900,  gfxH: 900,  gfxTop: 1847, gfxLeft: 356, gfxGapX: 48, gfxGapY: 0,  textY1: 3700, textY2: 3932 },
    C: { logoTop: 533, gfxW: 720,  gfxH: 720,  gfxTop: 1125, gfxLeft: 626, gfxGapX: 48, gfxGapY: 48, textY1: 3700, textY2: 3932 },
  },
};

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Fisher-Yates 셔플 후 앞에서 n개 반환 (비복원 추출 → 중복 없음)
const pickUnique = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
};

// ─── Section title ──────────────────────────────────────────────────────────
const SectionTitle = ({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) => (
  <div className="flex items-center gap-1.5 mb-3">
    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>{children}</h3>
    {extra}
  </div>
);

// ─── Dot visualization for random cards ─────────────────────────────────────
const DotIcon = ({ count }: { count: 1 | 3 | 9 }) => {
  if (count === 1) {
    return (
      <div className="flex items-center justify-center" style={{ width: 32, height: 32 }}>
        <div className="w-3 h-3 rounded-full bg-gray-400" />
      </div>
    );
  }
  if (count === 3) {
    return (
      <div className="flex items-center justify-center gap-1.5" style={{ width: 32, height: 32 }}>
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <div className="w-2 h-2 rounded-full bg-gray-400" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-[3px] items-center justify-items-center" style={{ width: 32, height: 32 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="w-[6px] h-[6px] rounded-full bg-gray-400" />
      ))}
    </div>
  );
};

// ─── Checkmark SVG ──────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Left Panel ─────────────────────────────────────────────────────────────
export const LeftPanel = () => {
  const {
    format, themeColor, setThemeColor, addElement, setAllElements,
    backgroundColor,
  } = useEditorStore();

  const isA3 = format === 'A3';
  const sizeMultiplier = isA3 ? 4 : 1;
  const canvasW = FORMATS[format].width;
  const canvasH = FORMATS[format].height;

  const bgKey = backgroundColor.toUpperCase();
  const mappedKey = Object.keys(CANVAS_ASSET_COLOR_MAP).find(
    (k) => k.toUpperCase() === bgKey,
  );
  const availableColors = mappedKey ? CANVAS_ASSET_COLOR_MAP[mappedKey] : FULL_PALETTE;

  // ── Random ────────────────────────────────────────────────────────────────
  const handleRandom = (count: 1 | 3 | 9) => {
    const type = count === 1 ? 'A' : count === 3 ? 'B' : 'C';
    const cfg = RANDOM_LAYOUTS[format][type];
    const newElements: EditorElement[] = [];

    // Logo (국문) — 비율 유지, 판형별 고정 높이
    const logo = BRAND_LOGOS.find((l) => l.name === '멋사대학') || BRAND_LOGOS[1];
    const logoH = isA3 ? 143 : format === '1:1' ? 22 : 34;
    const logoRatio = (logo.defaultWidth ?? 251) / (logo.defaultHeight ?? 40);
    const logoW = Math.round(logoH * logoRatio);
    newElements.push({
      id: nanoid(), type: 'graphic',
      x: Math.round((canvasW - logoW) / 2), y: cfg.logoTop,
      width: logoW, height: logoH, rotation: 0, visible: true, locked: false,
      graphicName: logo.name, style: { color: themeColor },
      content: logo.path, imageUrl: logo.imageUrl, isLogo: true,
    });

    // Graphics — 로고 제외 심볼만, 중복 없이 추출
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
          x: cfg.gfxLeft + i * (cfg.gfxW + cfg.gfxGapX),
          y: cfg.gfxTop,
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
      x: 0, y: cfg.textY1,
      width: canvasW, height: Math.round(fontSize * 1.3),
      rotation: 0, visible: true, locked: false,
      content: 'LIKELION UNIV.',
      style: { fontSize, fontWeight: 800, color: themeColor, textAlign: 'center' },
    });
    newElements.push({
      id: nanoid(), type: 'text',
      x: 0, y: cfg.textY2,
      width: canvasW, height: Math.round(fontSize * 1.3),
      rotation: 0, visible: true, locked: false,
      content: '14TH HACKATHON',
      style: { fontSize, fontWeight: 800, color: themeColor, textAlign: 'center' },
    });

    setAllElements(newElements);
  };

  // ── Add graphic ───────────────────────────────────────────────────────────
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

  // ── Add text ──────────────────────────────────────────────────────────────
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

  return (
    <div
      className="flex flex-col overflow-hidden shrink-0"
      style={{
        width: 292,
        height: 630,
        background: '#FCFCFD',
        borderRadius: 20,
        border: '1px solid #E5E7EB',
      }}
    >
      {/* Panel label */}
      <div className="shrink-0 px-5 pt-5 pb-2">
        <span style={{ fontSize: 12, fontWeight: 600, color: '#969696' }}>에셋</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 flex flex-col overflow-hidden px-5 pb-5">

        {/* ── 랜덤 ──────────────────────────── */}
        <div className="shrink-0 mb-5">
          <SectionTitle>랜덤</SectionTitle>
          <div className="flex gap-2">
            {([1, 3, 9] as const).map((n) => (
              <button
                key={n}
                onClick={() => handleRandom(n)}
                className="flex-1 flex items-center justify-center rounded-[12px] bg-[#F5F6F8] hover:bg-[#EDEEF1] border border-[#E5E7EB] transition-all cursor-pointer"
                style={{ height: 72 }}
              >
                <DotIcon count={n} />
              </button>
            ))}
          </div>
        </div>

        {/* ── 컬러 ──────────────────────────── */}
        <div className="shrink-0 mb-5">
          <SectionTitle
            extra={
              <div className="group relative">
                <div
                  className="w-4 h-4 rounded-full bg-[#FF6000] text-white flex items-center justify-center cursor-help"
                  style={{ fontSize: 10, fontWeight: 700 }}
                >!</div>
                <div
                  className="absolute left-0 top-6 z-50 hidden group-hover:block bg-black/85 text-white px-3 py-2 rounded-lg whitespace-nowrap shadow-lg"
                  style={{ fontSize: 11 }}
                >
                  그래픽, 텍스트, 로고에 동일 컬러가 적용됩니다.
                </div>
              </div>
            }
          >
            컬러
          </SectionTitle>
          <div className="flex flex-wrap gap-2 items-center">
            {availableColors.map((c) => {
              const isWhite = c.toUpperCase() === '#FFFFFF';
              const isActive = themeColor.toUpperCase() === c.toUpperCase();
              return (
                <button
                  key={c}
                  onClick={() => setThemeColor(c)}
                  className="rounded-full transition-all duration-150 cursor-pointer shrink-0 flex items-center justify-center"
                  style={{
                    width: isActive ? 36 : 24,
                    height: isActive ? 36 : 24,
                    backgroundColor: c,
                    boxShadow: isWhite
                      ? 'inset 0 0 0 1px #E5E7EB'
                      : '0 0 0 1px rgba(0,0,0,0.06)',
                  }}
                  title={c}
                >
                  {isActive && <CheckIcon />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 그래픽 (flex-1 to fill remaining space) ─── */}
        <div className="flex flex-col min-h-0 flex-1 mb-5">
          <SectionTitle>그래픽</SectionTitle>
          <div className="flex-1 min-h-0 relative">
            <div
              className="absolute inset-0 overflow-y-auto scrollbar-hidden pb-6"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                alignContent: 'start',
              }}
            >
              {GRAPHICS.map((g, i) => (
                <button
                  key={`${g.name}-${i}`}
                  onClick={() => handleAddGraphic(g)}
                  className="flex items-center justify-center rounded-[10px] bg-[#F5F6F8] hover:bg-[#EDEEF1] transition-all cursor-pointer border border-[#E5E7EB] p-2"
                  style={{ height: 64 }}
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
            {/* Bottom gradient fade */}
            <div
              className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, transparent, #FCFCFD)' }}
            />
          </div>
        </div>

        {/* ── 텍스트 ────────────────────────── */}
        <div className="shrink-0">
          <SectionTitle>텍스트</SectionTitle>
          <button
            onClick={handleAddText}
            className="flex items-center justify-center gap-2 rounded-[10px] bg-[#FF6000] hover:bg-[#E55600] text-white transition-all cursor-pointer active:scale-[0.98] w-full"
            style={{ height: 40, fontSize: 14, fontWeight: 600 }}
          >
            <TypeIcon className="w-4 h-4" />
            텍스트 추가
          </button>
        </div>

      </div>
    </div>
  );
};
