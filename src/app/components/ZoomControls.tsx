import { Plus, Minus, Maximize, Square } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onZoom100: () => void;
  isMobile?: boolean;
}

export const ZoomControls = ({ scale, onZoomIn, onZoomOut, onFit, onZoom100, isMobile }: ZoomControlsProps) => {
  const percentage = Math.round(scale * 100);

  // On mobile, position above the bottom tab bar (~64px) + some breathing room
  const bottomOffset = isMobile ? 76 : 16;

  return (
    <div
      className="fixed left-1/2 transform -translate-x-1/2 z-[200]"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <div className="flex items-center gap-1 bg-white rounded-[12px] shadow-lg border border-gray-200/80 px-1.5 py-1">
        <button
          onClick={onZoomOut}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-gray-100 active:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
          title="축소"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div
          className="w-14 h-8 flex items-center justify-center text-gray-700 select-none"
          style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
        >
          {percentage}%
        </div>

        <button
          onClick={onZoomIn}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-gray-100 active:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
          title="확대"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <button
          onClick={onFit}
          className="h-8 px-2.5 flex items-center justify-center rounded-[8px] hover:bg-gray-100 active:bg-gray-200 text-gray-600 transition-colors cursor-pointer gap-1"
          title="화면에 맞추기"
        >
          <Maximize className="w-3.5 h-3.5" />
          <span className="hidden md:inline" style={{ fontSize: '11px', fontWeight: 500 }}>맞춤</span>
        </button>

        <button
          onClick={onZoom100}
          className={cn(
            "h-8 px-2.5 flex items-center justify-center rounded-[8px] hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer",
            percentage === 100 ? "text-[#FF6000]" : "text-gray-600"
          )}
          title="100%로 보기"
        >
          <span style={{ fontSize: '11px', fontWeight: 600 }}>100%</span>
        </button>
      </div>
    </div>
  );
};