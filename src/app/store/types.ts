export type FormatType = '1:1' | '4:5' | '9:16' | 'A3';

export const FORMATS: Record<FormatType, { width: number; height: number; unit: string; label: string; description: string }> = {
  '1:1': { width: 1080, height: 1080, unit: 'px', label: '정방형 (1:1)', description: '1080×1080px' },
  '4:5': { width: 1080, height: 1350, unit: 'px', label: '세로형 (4:5)', description: '1080×1350px' },
  '9:16': { width: 1080, height: 1920, unit: 'px', label: '스토리 (9:16)', description: '1080×1920px' },
  'A3': { width: 3508, height: 4961, unit: 'px', label: '포스터 (A3)', description: '3508×4961px (300dpi)' },
};

export type ElementType = 'text' | 'graphic';

export type InteractionMode = 'idle' | 'object_selected' | 'object_editing_text' | 'object_transforming';

export interface EditorElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  content?: string;
  graphicName?: string;
  /** For PNG/raster graphics — stores the image URL for mask-based recoloring */
  imageUrl?: string;
  /** Logo flag — logos use same global themeColor as graphics */
  isLogo?: boolean;
  style?: {
    fontSize?: number;
    fontWeight?: number;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    opacity?: number;
    letterSpacing?: number;
    lineHeight?: number;
  };
}

export interface HistorySnapshot {
  elements: EditorElement[];
  backgroundColor: string;
}

export interface EditorState {
  title: string;
  format: FormatType;
  scale: number;
  elements: EditorElement[];
  selectedIds: string[];
  themeColor: string;
  backgroundColor: string;
  showMargins: boolean;
  showPrintSafeArea: boolean;
  printPreviewMode: boolean;
  sidebarOpen: boolean;
  interactionMode: InteractionMode;
  editingTextId: string | null;
  /** Mobile: text "…" menu is open — hides bottom tab bar */
  mobileTextMenuOpen: boolean;
  history: {
    past: HistorySnapshot[];
    future: HistorySnapshot[];
  };
  // Actions
  setTitle: (title: string) => void;
  setFormat: (format: FormatType) => void;
  setScale: (scale: number) => void;
  setThemeColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  toggleMargins: () => void;
  togglePrintSafeArea: () => void;
  togglePrintPreviewMode: () => void;
  setSidebarOpen: (open: boolean) => void;
  setInteractionMode: (mode: InteractionMode) => void;
  setEditingTextId: (id: string | null) => void;
  setMobileTextMenuOpen: (open: boolean) => void;

  addElement: (element: Partial<EditorElement>) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  removeElements: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  toggleElementVisibility: (id: string) => void;
  toggleElementLock: (id: string) => void;

  selectElement: (id: string, multi?: boolean) => void;
  deselectAll: () => void;

  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  reorderElements: (newOrder: EditorElement[]) => void;
  setAllElements: (elements: EditorElement[]) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}