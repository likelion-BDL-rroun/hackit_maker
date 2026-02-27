import React, { useEffect, useCallback } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';
import { useEditorStore } from '../store/useEditorStore';
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { FORMATS } from '../store/types';

export const EditorLayout = () => {
  const { undo, redo, save, format } = useEditorStore();

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      save();
    }, 30000);
    return () => clearInterval(interval);
  }, [save]);

  // Recovery prompt on mount
  useEffect(() => {
    const stored = localStorage.getItem('poster-editor-storage');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data?.state?.elements?.length > 0) {
          toast('이전 작업이 복구되었습니다', {
            description: '자동 저장된 데이터를 불러왔습니다.',
            duration: 3000,
          });
        }
      } catch {}
    }
  }, []);

  const handleExport = useCallback(async (exportFormat: 'png' | 'jpg' | 'pdf' = 'png') => {
    const node = document.getElementById('canvas-area');
    if (!node) {
      toast.error('캔버스를 찾을 수 없습니다');
      return;
    }

    const title = useEditorStore.getState().title || '디자인';
    const currentFormat = useEditorStore.getState().format;
    const isA3 = currentFormat === 'A3';

    // Fixed logical canvas dimensions — ALWAYS use these, never scrollWidth/scrollHeight
    const exportWidth = FORMATS[currentFormat].width;
    const exportHeight = FORMATS[currentFormat].height;

    // Temporarily hide the moveable controls
    const moveableEls = document.querySelectorAll('.moveable-control-box');
    moveableEls.forEach((el) => (el as HTMLElement).style.display = 'none');

    // Temporarily hide editor-only overlays (guides, grids, safe-area, warnings)
    const overlayEls = node.querySelectorAll('.editor-overlay');
    overlayEls.forEach((el) => (el as HTMLElement).style.display = 'none');

    // Temporarily disable print preview filter for export
    const prevFilter = node.style.filter;
    node.style.filter = 'none';

    // Clip off-canvas content during export
    const prevOverflow = node.style.overflow;
    node.style.overflow = 'hidden';

    try {
      toast('내보내기 준비 중...', { duration: 2000 });

      const options = {
        quality: 1.0,
        pixelRatio: 1,
        canvasWidth: exportWidth,
        canvasHeight: exportHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          overflow: 'hidden',
        },
        width: exportWidth,
        height: exportHeight,
        backgroundColor: useEditorStore.getState().backgroundColor,
      };

      if (exportFormat === 'png') {
        const dataUrl = await toPng(node, options);
        downloadFile(dataUrl, `${title}.png`);
        toast.success(`PNG로 내보내기 완료! (${exportWidth}×${exportHeight}px)`);
      } else if (exportFormat === 'jpg') {
        const dataUrl = await toJpeg(node, { ...options, backgroundColor: useEditorStore.getState().backgroundColor });
        downloadFile(dataUrl, `${title}.jpg`);
        toast.success(`JPG로 내보내기 완료! (${exportWidth}×${exportHeight}px)`);
      } else if (exportFormat === 'pdf') {
        const dataUrl = await toPng(node, options);

        let pdfWidth: number;
        let pdfHeight: number;

        if (isA3) {
          pdfWidth = 297;
          pdfHeight = 420;
        } else {
          pdfWidth = FORMATS[currentFormat].width * 0.2646;
          pdfHeight = FORMATS[currentFormat].height * 0.2646;
        }

        const pdf = new jsPDF({
          orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${title}.pdf`);
        toast.success(isA3 ? 'PDF로 내보내기 완료! (A3 297×420mm)' : 'PDF로 내보내기 완료!');
      }
    } catch (error) {
      console.error(error);
      toast.error('내보내기에 실패했습니다');
    } finally {
      node.style.filter = prevFilter;
      node.style.overflow = prevOverflow;
      overlayEls.forEach((el) => (el as HTMLElement).style.display = '');
      moveableEls.forEach((el) => (el as HTMLElement).style.display = '');
    }
  }, [format]);

  const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['input', 'textarea'].includes(document.activeElement?.tagName.toLowerCase() || '');
      const isEditable = document.activeElement?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && !isEditable) {
        const selected = useEditorStore.getState().selectedIds;
        if (selected.length > 0) {
          e.preventDefault();
          useEditorStore.getState().removeElements(selected);
        }
      }

      // Duplicate: Ctrl+D
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && !isInput && !isEditable) {
        e.preventDefault();
        const selected = useEditorStore.getState().selectedIds;
        if (selected.length === 1) {
          useEditorStore.getState().duplicateElement(selected[0]);
        }
      }

      // Save: Ctrl+S
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
        toast.success('저장되었습니다', { duration: 1500 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, save]);

  return (
    <div className="flex flex-col h-dvh w-screen overflow-hidden bg-[#F5F5F7] text-gray-900" style={{ fontFamily: "'Cabinet Grotesk', system-ui, sans-serif" }}>
      <TopBar onExport={() => handleExport('png')} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar onExport={handleExport} />
        {/* Canvas viewport: on mobile add bottom padding so content isn't hidden behind fixed bottom tabs */}
        <div className="flex flex-col flex-1 overflow-hidden relative pb-[env(safe-area-inset-bottom)] md:pb-0">
          <Canvas />
        </div>
      </div>
    </div>
  );
};