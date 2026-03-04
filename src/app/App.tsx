import React from 'react';
import { EditorLayout } from './components/EditorLayout';
import { Toaster } from 'sonner';
import '../styles/fonts.css';

function App() {
  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* ─── Moveable: 색상만 여기서 관리 (크기는 Canvas.tsx에서 scale 보정) ─── */
        .moveable-line {
          background: #FF6000 !important;
        }
        /* 리사이즈 핸들: 흰색 fill */
        .moveable-control {
          background: #ffffff !important;
        }
        /* 회전 핸들: .moveable-control을 상속하므로 명시적으로 orange 유지 */
        .moveable-rotation-control {
          background: #FF6000 !important;
        }
        .moveable-dashed {
          border-color: #FF6000 !important;
        }
        /* 중앙 원점 핸들: 기능 유지, 시각적으로만 숨김 */
        .moveable-origin {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        .moveable-control-box {
          overflow: visible !important;
        }
      `}</style>
      <EditorLayout />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />
    </>
  );
}

export default App;