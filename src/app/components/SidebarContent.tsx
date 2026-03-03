import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { FORMATS, FormatType } from '../store/types';
import { GRAPHICS, BRAND_LOGOS } from '../store/graphics';
import { cn } from '../../lib/utils';
import {
  Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Lock, Unlock,
  Type, Shapes, FileImage, FileText, Image as ImageIcon,
  Layers, Download, Paintbrush, Printer, ScanEye, Shield,
  CheckCircle2, AlertTriangle, Info, Search, X,
} from 'lucide-react';
import type { SidebarTab } from './Sidebar';

const PRESET_COLORS = [
  '#FFFFFF', '#FF6000', '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
  '#00C7BE', '#30B0C7', '#007AFF', '#5856D6', '#AF52DE',
  '#FF2D55', '#1D1D1F', '#636366', '#8E8E93',
];

const BG_PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF6000', '#F2EDE6', '#FFE066',
];

// Toggle switch component
const ToggleSwitch = ({ enabled, onToggle, size = 'default' }: { enabled: boolean; onToggle: () => void; size?: 'default' | 'small' }) => (
  <button
    onClick={onToggle}
    className={cn(
      "rounded-full transition-colors relative cursor-pointer shrink-0",
      size === 'small' ? 'w-8 h-5' : 'w-10 h-6',
      enabled ? "bg-[#FF6000]" : "bg-gray-200"
    )}
  >
    <div className={cn(
      "bg-white rounded-full absolute transition-all shadow-sm",
      size === 'small' ? 'w-3.5 h-3.5 top-[3px]' : 'w-4 h-4 top-1',
      size === 'small'
        ? (enabled ? "left-[15px]" : "left-[3px]")
        : (enabled ? "left-5" : "left-1")
    )} />
  </button>
);

export const SidebarContent = ({ activeTab, onExport }: { activeTab: SidebarTab; onExport: (format: 'png' | 'jpg' | 'pdf') => void }) => {
  const {
    format, setFormat, addElement, elements, selectElement, selectedIds,
    removeElements, themeColor, setThemeColor, backgroundColor, setBackgroundColor,
    toggleMargins, showMargins,
    showPrintSafeArea, togglePrintSafeArea,
    printPreviewMode, togglePrintPreviewMode,
    toggleElementVisibility, toggleElementLock, moveUp, moveDown, bringToFront, sendToBack,
  } = useEditorStore();

  const isA3 = format === 'A3';

  const [graphicSearch, setGraphicSearch] = useState('');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'pdf'>(isA3 ? 'pdf' : 'png');

  // Auto-select PDF when A3 is chosen
  useEffect(() => {
    if (isA3) setExportFormat('pdf');
  }, [isA3]);

  // Search-based graphic filtering
  const searchedGraphics = graphicSearch.trim()
    ? GRAPHICS.filter(g => {
        const q = graphicSearch.trim().toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          (g.keywords?.some(kw => kw.toLowerCase().includes(q)) ?? false)
        );
      })
    : GRAPHICS;

  const handleAddGraphic = (graphic: typeof GRAPHICS[0]) => {
    // Compute logical canvas dimensions for centering
    const A3_W = 3508, A3_H = 4961;
    const sizeMultiplier = isA3 ? 4 : 1;
    const canvasW = isA3 ? A3_W : FORMATS[format].width;
    const canvasH = isA3 ? A3_H : FORMATS[format].height;
    const w = (graphic.defaultWidth ?? 200) * sizeMultiplier;
    const h = (graphic.defaultHeight ?? w) * sizeMultiplier;
    addElement({
      type: 'graphic',
      x: Math.round((canvasW - w) / 2),
      y: Math.round((canvasH - h) / 2),
      width: w,
      height: h,
      rotation: 0,
      graphicName: graphic.name,
      style: { color: themeColor },
      content: graphic.path,
      imageUrl: graphic.imageUrl,
    });
  };

  const handleAddLogo = (logo: typeof BRAND_LOGOS[0]) => {
    const A3_W = 3508, A3_H = 4961;
    const sizeMultiplier = isA3 ? 4 : 1;
    const canvasW = isA3 ? A3_W : FORMATS[format].width;
    const canvasH = isA3 ? A3_H : FORMATS[format].height;
    const w = (logo.defaultWidth ?? 200) * sizeMultiplier;
    const h = (logo.defaultHeight ?? w) * sizeMultiplier;
    addElement({
      type: 'graphic',
      x: Math.round((canvasW - w) / 2),
      y: Math.round((canvasH - h) / 2),
      width: w,
      height: h,
      rotation: 0,
      graphicName: logo.name,
      style: { color: themeColor },
      content: logo.path,
      imageUrl: logo.imageUrl,
      isLogo: true,
    });
  };

  const handleAddText = (style: 'heading' | 'subheading' | 'body') => {
    const presets = {
      heading: { fontSize: 80, fontWeight: 800, text: '제목을 입력하세요', width: 600, height: 100 },
      subheading: { fontSize: 40, fontWeight: 600, text: '소제목', width: 380, height: 60 },
      body: { fontSize: 20, fontWeight: 400, text: '본문 텍스트를 입력하세요', width: 320, height: 44 },
    };
    const p = presets[style];
    const sizeMultiplier = isA3 ? 4 : 1;
    const canvasW = isA3 ? 3508 : FORMATS[format].width;
    const canvasH = isA3 ? 4961 : FORMATS[format].height;
    const fontSize = p.fontSize * sizeMultiplier;
    const w = p.width * sizeMultiplier;
    const h = p.height * sizeMultiplier;
    addElement({
      type: 'text',
      x: Math.round((canvasW - w) / 2),
      y: Math.round((canvasH - h) / 2),
      width: w,
      height: h,
      rotation: 0,
      content: p.text,
      style: { fontSize, fontWeight: p.fontWeight, color: themeColor, textAlign: 'center' },
    });
  };

  // A3-specific export options
  const a3ExportOptions = [
    {
      id: 'pdf' as const,
      icon: FileText,
      label: 'PDF',
      badge: '인쇄 추천',
      badgeColor: 'bg-[#FF6000]/10 text-[#FF6000]',
      description: '고해상도 PDF · 인쇄소 입고용',
      helper: null,
    },
    {
      id: 'jpg' as const,
      icon: FileImage,
      label: 'JPG',
      badge: '300dpi',
      badgeColor: 'bg-blue-50 text-blue-600',
      description: '300dpi 고해상도 · 3508×4961px',
      helper: null,
    },
    {
      id: 'png' as const,
      icon: ImageIcon,
      label: 'PNG',
      badge: '웹 전용',
      badgeColor: 'bg-gray-100 text-gray-500',
      description: '웹 공유용 · 투명 배경 미지원 (A3)',
      helper: null,
    },
  ];

  return (
    <>
      {/* ===== 판형 탭 ===== */}
      {activeTab === 'format' && (
        <div className="space-y-5">
          <div className="space-y-2.5">
            <h3 style={{ fontSize: '13px', fontWeight: 700 }} className="text-gray-900">캔버스 크기</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(FORMATS) as FormatType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-[12px] border-2 transition-all cursor-pointer",
                    format === f
                      ? "border-[#FF6000] bg-orange-50/60 text-[#FF6000]"
                      : "border-gray-100 hover:border-gray-200 text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "border-2 border-current mb-2 rounded-[2px]",
                    f === '1:1' ? "w-7 h-7" :
                    f === '4:5' ? "w-6 h-7" :
                    f === '9:16' ? "w-4 h-7" : "w-5 h-7"
                  )} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{FORMATS[f].label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 400 }} className="opacity-60 mt-0.5">{FORMATS[f].description}</span>
                  {f === 'A3' && format === f && (
                    <span className="mt-1 px-1.5 py-0.5 rounded bg-[#FF6000]/10 text-[#FF6000]" style={{ fontSize: '9px', fontWeight: 600 }}>
                      300dpi
                    </span>
                  )}
                </button>
              ))}
            </div>


          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 style={{ fontSize: '13px', fontWeight: 700 }} className="text-gray-900">여백 가이드</h3>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: '12px', fontWeight: 500 }} className="text-gray-500">여백 표시</span>
              <ToggleSwitch enabled={showMargins} onToggle={toggleMargins} />
            </div>

            {/* A3-only: Print Safe Area toggle */}
            {isA3 && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: '12px', fontWeight: 500 }} className="text-gray-500">인쇄 안전 영역 표시</span>
                    <div className="relative group">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-600 cursor-help">
                        <span style={{ fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>!</span>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 px-3 py-2 bg-gray-900 text-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                        <p style={{ fontSize: '11px', fontWeight: 400 }} className="leading-relaxed">
                          각 변에서 10mm(118px) 안쪽이 안전 영역입니다. 중요한 텍스트와 그래픽은 이 안에 배치하세요.
                        </p>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </div>
                  <ToggleSwitch enabled={showPrintSafeArea} onToggle={togglePrintSafeArea} />
                </div>
              </>
            )}
          </div>

          {/* Background Color */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 style={{ fontSize: '13px', fontWeight: 700 }} className="text-gray-900">배경 컬러</h3>
            <div className="flex items-center gap-2.5">
              {BG_PRESET_COLORS.map((c) => {
                const isWhite = c.toUpperCase() === '#FFFFFF';
                const isActive = backgroundColor.toUpperCase() === c.toUpperCase();
                return (
                  <button
                    key={c}
                    onClick={() => setBackgroundColor(c)}
                    className={cn(
                      "rounded-full transition-all duration-200 cursor-pointer",
                      isActive
                        ? "w-8 h-8 scale-105"
                        : "w-7 h-7 hover:scale-105"
                    )}
                    style={{
                      backgroundColor: c,
                      boxShadow: isActive
                        ? isWhite
                          ? '0 0 0 2.5px #FF6000, inset 0 0 0 1px #E5E7EB, 0 2px 8px rgba(0,0,0,0.1)'
                          : '0 0 0 2.5px #FF6000, 0 2px 8px rgba(0,0,0,0.1)'
                        : isWhite
                          ? 'inset 0 0 0 1px #E5E7EB'
                          : '0 0 0 1px rgba(0,0,0,0.06)',
                    }}
                    title={c}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== 그래픽 탭 ===== */}
      {activeTab === 'graphics' && (
        <div className="space-y-5">
          {/* ===== 1) 그래픽 컬러 (컬러 선택) ===== */}
          <div className="space-y-3">
            <div className="relative bg-white rounded-[12px] border border-gray-100/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-3">
              <div className="flex items-center gap-3">
                {/* Clickable color preview */}
                <label className="relative shrink-0 cursor-pointer group">
                  <div
                    className="w-11 h-11 rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] transition-all group-hover:shadow-[0_3px_14px_rgba(0,0,0,0.12)] group-hover:scale-105"
                    style={{ backgroundColor: themeColor }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-black/0 group-hover:bg-black/10 transition-colors">
                    <Paintbrush className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow-sm" />
                  </div>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>

                {/* Label + HEX */}
                <div className="flex-1 min-w-0">
                  <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '-0.01em' }} className="text-gray-900">
                    현재 적용 컬러
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em' }} className="font-mono text-gray-400 uppercase block mt-1">
                    {themeColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Helper text — outside card */}
            <p style={{ fontSize: '10.5px', fontWeight: 400 }} className="text-gray-400 px-0.5 leading-relaxed">
              그래픽, 로고, 텍스트에 동일한 컬러가 적용됩니다.
            </p>

            {/* Preset swatches */}
            <div className="px-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => {
                  const isWhite = c.toUpperCase() === '#FFFFFF';
                  const isActive = themeColor.toUpperCase() === c.toUpperCase();
                  return (
                    <button
                      key={c}
                      onClick={() => setThemeColor(c)}
                      className={cn(
                        "rounded-full transition-all duration-200 cursor-pointer",
                        isActive
                          ? "w-8 h-8 scale-105"
                          : "w-7 h-7 hover:scale-105"
                      )}
                      style={{
                        backgroundColor: c,
                        boxShadow: isActive
                          ? isWhite
                            ? '0 0 0 2.5px #FF6000, inset 0 0 0 1px #E5E7EB, 0 2px 8px rgba(0,0,0,0.1)'
                            : '0 0 0 2.5px #FF6000, 0 2px 8px rgba(0,0,0,0.1)'
                          : isWhite
                            ? 'inset 0 0 0 1px #E5E7EB'
                            : '0 0 0 1px rgba(0,0,0,0.06)',
                      }}
                      title={c}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===== 2) 로고 섹션 ===== */}
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 style={{ fontSize: '13px', fontWeight: 700 }} className="text-gray-900">로고</h3>
              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400" style={{ fontSize: '9px', fontWeight: 600 }}>
                브랜드 자산
              </span>
            </div>

            {/* Logo grid — uses same global color as graphics */}
            <div className="grid grid-cols-3 gap-2.5">
              {BRAND_LOGOS.map((logo, i) => (
                <button
                  key={`logo-${logo.name}-${i}`}
                  onClick={() => handleAddLogo(logo)}
                  className="group aspect-[5/2] bg-[#F5F6F8] hover:bg-[#EDEEF1] rounded-[10px] flex items-center justify-center p-2.5 transition-all border border-gray-100/80 hover:border-gray-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] cursor-pointer"
                  title={logo.name}
                >
                  <div
                    className="w-full h-full transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: themeColor,
                      WebkitMaskImage: `url(${logo.imageUrl})`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskImage: `url(${logo.imageUrl})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                    }}
                  />
                </button>
              ))}
            </div>

            <p style={{ fontSize: '10.5px', fontWeight: 400 }} className="text-gray-400 px-0.5 leading-relaxed">
              로고에도 위 그래픽 컬러가 동일하게 적용됩니다.
            </p>
          </div>

          {/* ===== 3) 그래픽 에셋 섹션 ===== */}
          <div className="pt-3 border-t border-gray-100 space-y-4">
            <h3 style={{ fontSize: '13px', fontWeight: 700 }} className="text-gray-900">그래픽</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                type="text"
                value={graphicSearch}
                onChange={(e) => setGraphicSearch(e.target.value)}
                placeholder="그래픽 검색..."
                className="w-full bg-gray-50/80 rounded-[10px] border border-gray-200/80 pl-9 pr-8 py-2.5 outline-none text-gray-700 placeholder:text-gray-300 focus:border-[#FF6000]/40 focus:ring-2 focus:ring-[#FF6000]/10 focus:bg-white transition-all"
                style={{ fontSize: '13px', fontWeight: 400 }}
              />
              {graphicSearch && (
                <button
                  onClick={() => setGraphicSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200/80 hover:bg-gray-300/80 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>

            {/* Results count when searching */}
            {graphicSearch.trim() && (
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '11px', fontWeight: 500 }} className="text-gray-400">
                  {searchedGraphics.length}개 결과
                </span>
                {searchedGraphics.length === 0 && (
                  <button
                    onClick={() => setGraphicSearch('')}
                    className="text-[#FF6000] cursor-pointer"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                  >
                    초기화
                  </button>
                )}
              </div>
            )}

            {/* Grid */}
            {searchedGraphics.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5">
                {searchedGraphics.map((g, i) => (
                  <button
                    key={`${g.name}-${i}`}
                    onClick={() => handleAddGraphic(g)}
                    className="group aspect-square bg-[#F5F6F8] hover:bg-[#EDEEF1] rounded-[10px] flex flex-col items-center justify-center p-3 transition-all border border-gray-100/80 hover:border-gray-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] cursor-pointer"
                    title={g.name}
                  >
                    {g.imageUrl ? (
                      /* PNG graphic preview — recolored via CSS mask */
                      <div
                        className="w-full h-full flex-1 transition-transform group-hover:scale-105"
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
                      <svg viewBox={g.viewBox} className="w-full h-full flex-1 transition-transform group-hover:scale-105" preserveAspectRatio="xMidYMid meet">
                        <path d={g.path} fill={themeColor} />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Shapes className="w-8 h-8 mx-auto mb-2.5 text-gray-200" />
                <p style={{ fontSize: '12px', fontWeight: 500 }} className="text-gray-400">
                  검색 결과가 없습니다
                </p>
                <p style={{ fontSize: '11px', fontWeight: 400 }} className="text-gray-300 mt-1">
                  다른 키워드로 검색해 보세요
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 텍스트 탭 ===== */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          <h3 style={{ fontSize: '13px', fontWeight: 700 }} className="text-gray-900">텍스트 추가</h3>
          <div className="space-y-2.5">
            <button
              onClick={() => handleAddText('heading')}
              className="w-full bg-gray-50 hover:bg-gray-100 p-4 rounded-[12px] text-left transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
            >
              <span className="text-gray-900 block" style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: '28px', fontWeight: 800, lineHeight: 1.2 }}>
                제목 추가
              </span>
            </button>
            <button
              onClick={() => handleAddText('subheading')}
              className="w-full bg-gray-50 hover:bg-gray-100 p-4 rounded-[12px] text-left transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
            >
              <span className="text-gray-800 block" style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: '20px', fontWeight: 600, lineHeight: 1.3 }}>
                소제목 추가
              </span>
            </button>
            <button
              onClick={() => handleAddText('body')}
              className="w-full bg-gray-50 hover:bg-gray-100 p-4 rounded-[12px] text-left transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
            >
              <span className="text-gray-600 block" style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: '14px', fontWeight: 400, lineHeight: 1.5 }}>
                본문 텍스트 추가
              </span>
            </button>
          </div>

          <div className="p-3 bg-gray-50 rounded-[8px] border border-gray-100 mt-3">
            <p style={{ fontSize: '11px', fontWeight: 500 }} className="text-gray-500 leading-relaxed">
              폰트는 브랜드 일관성을 위해 <span style={{ fontWeight: 700 }}>Cabinet Grotesk</span>로 고정됩니다. 텍스트 색상은 그래픽 컬러(전역 컬러)를 따릅니다.
            </p>
          </div>
        </div>
      )}

      {/* ===== 레이어 탭 ===== */}
      {activeTab === 'layers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 style={{ fontSize: '13px', fontWeight: 700 }} className="text-gray-900">레이어</h3>
            <span style={{ fontSize: '11px', fontWeight: 500 }} className="text-gray-400">{elements.length}개</span>
          </div>
          <div className="space-y-0.5">
            {[...elements].reverse().map((el) => {
              const isSelected = selectedIds.includes(el.id);
              return (
                <div
                  key={el.id}
                  className={cn(
                    "group flex items-center gap-2 p-2 rounded-[8px] cursor-pointer transition-colors",
                    isSelected ? "bg-orange-50 border border-[#FF6000]/20" : "hover:bg-gray-50 border border-transparent"
                  )}
                  onClick={() => selectElement(el.id)}
                >
                  <div className="shrink-0">
                    {el.type === 'text' ? (
                      <Type className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                      <Shapes className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>

                  <span
                    className={cn("flex-1 truncate", !el.visible && "opacity-40")}
                    style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#FF6000' : '#374151' }}
                  >
                    {el.type === 'text' ? (el.content?.slice(0, 20) || '텍스트') : (el.graphicName || '그래픽')}
                  </span>

                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveUp(el.id); }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="위로"
                    >
                      <ChevronUp className="w-3 h-3 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveDown(el.id); }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="아래로"
                    >
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleElementVisibility(el.id); }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title={el.visible ? '숨기기' : '보이기'}
                    >
                      {el.visible ? (
                        <Eye className="w-3 h-3 text-gray-500" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeElements([el.id]); }}
                      className="p-1 hover:bg-red-50 rounded text-gray-500 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
            {elements.length === 0 && (
              <div className="text-center py-12 text-gray-300">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p style={{ fontSize: '12px', fontWeight: 500 }}>레이어가 없습니다</p>
                <p style={{ fontSize: '11px', fontWeight: 400 }} className="mt-1">그래픽이나 텍스트를 추가하세요</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 내보내기 탭 ===== */}
      {activeTab === 'export' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 style={{ fontSize: '13px', fontWeight: 700 }} className="text-gray-900">내보내기</h3>
            {isA3 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF6000]/8 text-[#FF6000]" style={{ fontSize: '10px', fontWeight: 600 }}>
                <Printer className="w-3 h-3" />
                인쇄 모드
              </span>
            )}
          </div>

          {/* A3 Export Options */}
          {isA3 ? (
            <div className="space-y-3">
              <span style={{ fontSize: '12px', fontWeight: 600 }} className="text-gray-700 block">파일 형식</span>
              <div className="space-y-2">
                {a3ExportOptions.map((opt) => (
                  <div key={opt.id}>
                    <button
                      onClick={() => setExportFormat(opt.id)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3.5 rounded-[12px] border-2 transition-all cursor-pointer text-left",
                        exportFormat === opt.id
                          ? "border-[#FF6000] bg-orange-50/50 shadow-[0_0_0_1px_rgba(255,96,0,0.1)]"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-lg shrink-0 mt-0.5",
                        exportFormat === opt.id ? "bg-[#FF6000]/10" : "bg-gray-100"
                      )}>
                        <opt.icon className={cn("w-4.5 h-4.5", exportFormat === opt.id ? "text-[#FF6000]" : "text-gray-400")} style={{ width: 18, height: 18 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '13px', fontWeight: 700 }} className={cn(exportFormat === opt.id ? "text-gray-900" : "text-gray-700")}>
                            {opt.label}
                          </span>
                          <span className={cn("px-1.5 py-0.5 rounded-md", opt.badgeColor)} style={{ fontSize: '9px', fontWeight: 600 }}>
                            {opt.badge}
                          </span>
                        </div>
                        <span style={{ fontSize: '10.5px', fontWeight: 400 }} className="text-gray-400 block mt-0.5">
                          {opt.description}
                        </span>
                      </div>
                      {exportFormat === opt.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF6000] shrink-0 mt-1" />
                      )}
                    </button>

                    {/* Helper text for PDF */}
                    {opt.helper && exportFormat === opt.id && (
                      <div className="flex items-start gap-2 mt-1.5 ml-1 px-3 py-2 bg-amber-50/60 rounded-lg border border-amber-100/60">
                        <Info className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                        <p style={{ fontSize: '10px', fontWeight: 500 }} className="text-amber-700 leading-relaxed">
                          {opt.helper}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Standard Export Options */
            <div className="space-y-3">
              <span style={{ fontSize: '12px', fontWeight: 600 }} className="text-gray-700 block">파일 형식</span>
              <div className="space-y-2">
                {(['png', 'jpg', 'pdf'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-[12px] border-2 transition-all cursor-pointer",
                      exportFormat === fmt
                        ? "border-[#FF6000] bg-orange-50/50"
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    {fmt === 'pdf' ? (
                      <FileText className="w-5 h-5 text-gray-500" />
                    ) : (
                      <FileImage className="w-5 h-5 text-gray-500" />
                    )}
                    <div className="text-left">
                      <span style={{ fontSize: '13px', fontWeight: 600 }} className="text-gray-800 block uppercase">{fmt}</span>
                      <span style={{ fontSize: '10px', fontWeight: 400 }} className="text-gray-400">
                        {fmt === 'png' && '투명 배경 지원 · 고화질'}
                        {fmt === 'jpg' && '작은 파일 크기 · SNS 최적'}
                        {fmt === 'pdf' && '인쇄 및 공유용'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onExport(exportFormat)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-[#FF6000] hover:bg-[#E55600] rounded-[12px] shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            style={{ fontSize: '14px', fontWeight: 700 }}
          >
            <Download className="w-4 h-4" />
            {exportFormat.toUpperCase()}로 내보내기
          </button>

          <div className="p-3 bg-gray-50 rounded-[8px] border border-gray-100">
            <p style={{ fontSize: '11px', fontWeight: 400 }} className="text-gray-400 leading-relaxed">
              현재 판형: <span style={{ fontWeight: 600 }} className="text-gray-600">{FORMATS[format].label}</span> ({FORMATS[format].description})
              {isA3 && (
                <span className="block mt-1 text-gray-500" style={{ fontWeight: 500 }}>
                  내보내기 해상도: 3508×4961px (300dpi)
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
};