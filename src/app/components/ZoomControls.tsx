import { Plus, Minus, Undo2, Redo2, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useEditorStore } from '../store/useEditorStore';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onZoom100: () => void;
  isMobile?: boolean;
  onExport?: () => void;
}

export const ZoomControls = ({
  scale,
  onZoomIn,
  onZoomOut,
  onFit,
  onZoom100,
  isMobile,
  onExport,
}: ZoomControlsProps) => {
  const { undo, redo, history } = useEditorStore();
  const percentage = Math.round(scale * 100);
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Zoom controls + Undo/Redo */}
      <div className="flex items-center gap-1 bg-white rounded-[12px] shadow-lg border border-gray-200/80 px-1.5 py-1">
        {/* Zoom */}
        <button
          onClick={onZoomOut}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-gray-100 active:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
          title="축소"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div
          className="w-10 h-8 flex items-center justify-center text-gray-700 select-none"
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

        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-gray-100 active:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="실행 취소"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-gray-100 active:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="다시 실행"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* PNG Export button */}
      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-2 h-10 px-5 bg-[#FF6000] hover:bg-[#E55600] text-white rounded-[12px] shadow-lg transition-all active:scale-[0.97] cursor-pointer"
          style={{ fontWeight: 700, fontSize: 13 }}
        >
          <Download className="w-4 h-4" />
          PNG
        </button>
      )}
    </div>
  );
};
