import { useEditorStore } from '../store/useEditorStore';
import { Download, RotateCcw, Check, Loader2, Undo2, Redo2 } from 'lucide-react';
import logoImg from '../../assets/7a2a1536667e5a5a4cdad9322018dbd9e198d6ae.png';

interface TopBarProps {
  onExport: () => void;
}

export const TopBar = ({ onExport }: TopBarProps) => {
  const { title, setTitle, isSaving, reset, undo, redo, history } = useEditorStore();

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <div className="border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-6 shadow-sm z-[100] relative shrink-0" style={{ height: 'calc(3.5rem + env(safe-area-inset-top, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Left: Logo + Undo/Redo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#FF6000] rounded-[8px] flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
          <img src={logoImg} alt="Logo" className="w-5 h-5 object-contain" />
        </div>

        {/* Undo/Redo — always visible on all screen sizes */}
        <div className="flex items-center gap-0.5 ml-1 md:ml-2 md:border-r md:border-gray-200 md:pr-3 md:mr-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600"
            title="실행 취소 (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600"
            title="다시 실행 (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Title */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[50%] px-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm text-gray-800 bg-transparent border-transparent border rounded-lg hover:border-gray-200 focus:border-[#FF6000] px-3 py-1.5 transition-all outline-none w-32 sm:w-48 lg:w-64 text-center truncate"
          style={{ fontWeight: 600 }}
          placeholder="프로젝트 제목"
        />
      </div>

      {/* Right: Save status + Actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-full border border-gray-100" style={{ fontWeight: 500 }}>
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-[#FF6000]" />
              <span className="text-[#FF6000]">저장 중...</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span>저장됨</span>
            </>
          )}
        </div>

        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-[8px] transition-colors"
          style={{ fontWeight: 500 }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">초기화</span>
        </button>

        {/* Export button — desktop only (mobile uses bottom tab) */}
        <button
          onClick={onExport}
          className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs text-white bg-[#FF6000] hover:bg-[#E55600] rounded-[8px] shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
          style={{ fontWeight: 700 }}
        >
          <Download className="w-3.5 h-3.5" />
          내보내기
        </button>
      </div>
    </div>
  );
};