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
        .moveable-line {
          background: #FF6000 !important;
        }
        .moveable-control {
          background: #FF6000 !important;
          border: 2px solid white !important;
        }
        .moveable-dashed {
          border-color: #FF6000 !important;
        }
        /* ─── Touch-friendly Moveable handles ─── */
        /* Enlarge all control handles on touch devices for easier grabbing */
        @media (pointer: coarse) {
          .moveable-control {
            width: 16px !important;
            height: 16px !important;
            margin-top: -8px !important;
            margin-left: -8px !important;
            border-radius: 50% !important;
            /* Invisible expanded touch target via pseudo-element */
          }
          .moveable-control::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 44px;
            height: 44px;
            transform: translate(-50%, -50%);
          }
          /* Rotation handle: bigger hit area */
          .moveable-rotation-control {
            width: 18px !important;
            height: 18px !important;
            margin-top: -9px !important;
            margin-left: -9px !important;
          }
          .moveable-rotation-control::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 48px;
            height: 48px;
            transform: translate(-50%, -50%);
          }
          /* Prevent moveable control-box from being clipped */
          .moveable-control-box {
            overflow: visible !important;
          }
        }
        /* Even on desktop, ensure rotation handle is comfortably sized */
        .moveable-rotation-control::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          transform: translate(-50%, -50%);
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