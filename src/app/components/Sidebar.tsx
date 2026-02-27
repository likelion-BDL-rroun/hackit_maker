import React, { useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { LayoutGrid, Shapes, Type, Layers, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SidebarContent } from './SidebarContent';

export type SidebarTab = 'format' | 'graphics' | 'text' | 'layers' | 'export';

interface SidebarProps {
  onExport: (format: 'png' | 'jpg' | 'pdf') => void;
}

export const Sidebar = ({ onExport }: SidebarProps) => {
  const { sidebarOpen, setSidebarOpen } = useEditorStore();
  const mobileTextMenuOpen = useEditorStore((s) => s.mobileTextMenuOpen);
  const [activeTab, setActiveTab] = useState<SidebarTab>('format');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleMobileTabClick = (tab: SidebarTab) => {
    if (activeTab === tab) {
      setMobileDrawerOpen(!mobileDrawerOpen);
    } else {
      setActiveTab(tab);
      setMobileDrawerOpen(true);
    }
  };

  const tabs: { id: SidebarTab; icon: React.ElementType; label: string }[] = [
    { id: 'format', icon: LayoutGrid, label: '판형' },
    { id: 'graphics', icon: Shapes, label: '그래픽' },
    { id: 'text', icon: Type, label: '텍스트' },
    { id: 'layers', icon: Layers, label: '레이어' },
    { id: 'export', icon: Download, label: '내보내기' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex-col shrink-0",
          sidebarOpen ? "w-72 lg:w-80" : "w-0 border-r-0"
        )}
        style={{ overflow: sidebarOpen ? undefined : 'hidden' }}
      >
        {/* Tab Icons */}
        <div className="flex items-center justify-around border-b border-gray-100 px-2 py-1.5 bg-white sticky top-0 z-10 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "p-2 rounded-[8px] flex flex-col items-center gap-0.5 transition-colors w-full cursor-pointer",
                activeTab === tab.id ? "bg-orange-50 text-[#FF6000]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              )}
            >
              <tab.icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: '10px', fontWeight: activeTab === tab.id ? 600 : 500 }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarContent activeTab={activeTab} onExport={onExport} />
        </div>
      </div>

      {/* Floating Toggle Button — rendered outside sidebar to avoid overflow clipping */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "hidden md:flex fixed top-1/2 -translate-y-1/2 z-50 items-center justify-center",
          "w-6 h-12 bg-white shadow-[2px_0_8px_rgba(0,0,0,0.06)] rounded-r-[10px]",
          "border border-gray-200 border-l-0",
          "text-gray-400 hover:text-[#FF6000] hover:bg-gray-50",
          "transition-all duration-300 ease-in-out outline-none cursor-pointer"
        )}
        style={{
          left: sidebarOpen ? `calc(var(--sidebar-width) - 1px)` : '-1px',
        }}
      >
        {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* CSS variable for sidebar width */}
      <style>{`
        @media (min-width: 768px) and (max-width: 1023px) {
          :root { --sidebar-width: ${sidebarOpen ? '288px' : '0px'}; }
        }
        @media (min-width: 1024px) {
          :root { --sidebar-width: ${sidebarOpen ? '320px' : '0px'}; }
        }
      `}</style>

      {/* Mobile Bottom Navigation — hide when text menu is open */}
      {!mobileTextMenuOpen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] z-[1000] flex justify-around px-1 py-1.5" style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleMobileTabClick(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 p-2 rounded-[8px] transition-colors flex-1",
                activeTab === tab.id && mobileDrawerOpen ? "text-[#FF6000]" : "text-gray-400"
              )}
            >
              <tab.icon style={{ width: 20, height: 20 }} />
              <span style={{ fontSize: '10px', fontWeight: 500 }}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mobile Backdrop — closes drawer on tap */}
      {!mobileTextMenuOpen && (
        <div
          className={cn(
            "md:hidden fixed inset-0 z-[800] transition-opacity duration-300",
            mobileDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
          onPointerDown={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      {!mobileTextMenuOpen && (
        <div className={cn(
          "md:hidden fixed inset-x-0 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 z-[900] overflow-hidden border-t border-gray-100 flex flex-col",
          mobileDrawerOpen ? "translate-y-0 h-[50vh]" : "translate-y-full h-0"
        )} style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto my-2.5 shrink-0" />
          <div className="px-4 pb-4 overflow-y-auto flex-1">
            <SidebarContent activeTab={activeTab} onExport={onExport} />
          </div>
        </div>
      )}
    </>
  );
};