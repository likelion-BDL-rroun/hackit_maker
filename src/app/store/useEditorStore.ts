import { EditorState, EditorElement, FormatType, FORMATS, HistorySnapshot } from './types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

const MAX_HISTORY = 30;

const makeSnapshot = (state: { elements: EditorElement[]; backgroundColor: string }): HistorySnapshot => ({
  elements: state.elements,
  backgroundColor: state.backgroundColor,
});

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      title: 'Untitled',
      format: '4:5',
      scale: 1,
      elements: [],
      selectedIds: [],
      themeColor: '#FF6000',
      backgroundColor: '#FFFFFF',
      showMargins: true,
      showPrintSafeArea: true,
      printPreviewMode: false,
      sidebarOpen: true,
      interactionMode: 'idle',
      editingTextId: null,
      mobileTextMenuOpen: false,
      history: {
        past: [],
        future: [],
      },
      isSaving: false,
      lastSaved: null,

      setTitle: (title) => set({ title }),
      setFormat: (format) => set({ format }),
      setScale: (scale) => set({ scale: Math.round(scale * 100) / 100 }),
      setThemeColor: (color) => set({ themeColor: color }),
      setBackgroundColor: (color) => {
        const state = get();
        set({
          backgroundColor: color,
          history: {
            past: [...state.history.past, makeSnapshot(state)].slice(-MAX_HISTORY),
            future: [],
          },
        });
      },
      toggleMargins: () => set((state) => ({ showMargins: !state.showMargins })),
      togglePrintSafeArea: () => set((state) => ({ showPrintSafeArea: !state.showPrintSafeArea })),
      togglePrintPreviewMode: () => set((state) => ({ printPreviewMode: !state.printPreviewMode })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setInteractionMode: (mode) => set({ interactionMode: mode }),
      setEditingTextId: (id) => set({
        editingTextId: id,
        interactionMode: id ? 'object_editing_text' : (get().selectedIds.length > 0 ? 'object_selected' : 'idle'),
      }),
      setMobileTextMenuOpen: (open) => set({ mobileTextMenuOpen: open }),

      pushHistory: () => {
        set((state) => ({
          history: {
            past: [...state.history.past, makeSnapshot(state)].slice(-MAX_HISTORY),
            future: [],
          },
        }));
      },

      addElement: (el) => {
        set((state) => {
          const newEl: EditorElement = {
            id: nanoid(),
            type: 'text',
            x: 100,
            y: 100,
            width: 200,
            height: 100,
            rotation: 0,
            visible: true,
            locked: false,
            ...el,
          };
          const newElements = [...state.elements, newEl];
          return {
            elements: newElements,
            selectedIds: [newEl.id],
            history: {
              past: [...state.history.past, makeSnapshot(state)].slice(-MAX_HISTORY),
              future: [],
            },
          };
        });
      },

      updateElement: (id, updates) => {
        set((state) => {
          const newElements = state.elements.map((el) =>
            el.id === id ? { ...el, ...updates } : el
          );
          return { elements: newElements };
        });
      },

      removeElements: (ids) => {
        set((state) => {
          const newElements = state.elements.filter((el) => !ids.includes(el.id));
          return {
            elements: newElements,
            selectedIds: [],
            mobileTextMenuOpen: false,
            history: {
              past: [...state.history.past, makeSnapshot(state)].slice(-MAX_HISTORY),
              future: [],
            },
          };
        });
      },

      duplicateElement: (id) => {
        set((state) => {
          const el = state.elements.find((e) => e.id === id);
          if (!el) return state;
          const newEl: EditorElement = {
            ...el,
            id: nanoid(),
            x: el.x + 20,
            y: el.y + 20,
          };
          return {
            elements: [...state.elements, newEl],
            selectedIds: [newEl.id],
            history: {
              past: [...state.history.past, makeSnapshot(state)].slice(-MAX_HISTORY),
              future: [],
            },
          };
        });
      },

      toggleElementVisibility: (id) => {
        set((state) => ({
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, visible: !el.visible } : el
          ),
        }));
      },

      toggleElementLock: (id) => {
        set((state) => ({
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, locked: !el.locked } : el
          ),
        }));
      },

      selectElement: (id, multi) => {
        set((state) => {
          if (!id) return { selectedIds: [], interactionMode: 'idle', editingTextId: null, mobileTextMenuOpen: false };
          if (multi) {
            if (state.selectedIds.includes(id)) {
              const newIds = state.selectedIds.filter(i => i !== id);
              return { selectedIds: newIds, interactionMode: newIds.length > 0 ? 'object_selected' : 'idle', editingTextId: null, mobileTextMenuOpen: false };
            }
            return { selectedIds: [...state.selectedIds, id], interactionMode: 'object_selected', editingTextId: null, mobileTextMenuOpen: false };
          }
          return { selectedIds: [id], interactionMode: 'object_selected', editingTextId: null, mobileTextMenuOpen: false };
        });
      },

      deselectAll: () => set({ selectedIds: [], interactionMode: 'idle', editingTextId: null, mobileTextMenuOpen: false }),

      bringToFront: (id) => {
        set((state) => {
          const index = state.elements.findIndex((e) => e.id === id);
          if (index === -1) return state;
          const newElements = [...state.elements];
          const [removed] = newElements.splice(index, 1);
          newElements.push(removed);
          return { elements: newElements };
        });
      },

      sendToBack: (id) => {
        set((state) => {
          const index = state.elements.findIndex((e) => e.id === id);
          if (index === -1) return state;
          const newElements = [...state.elements];
          const [removed] = newElements.splice(index, 1);
          newElements.unshift(removed);
          return { elements: newElements };
        });
      },

      moveUp: (id) => {
        set((state) => {
          const index = state.elements.findIndex((e) => e.id === id);
          if (index === -1 || index === state.elements.length - 1) return state;
          const newElements = [...state.elements];
          [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
          return { elements: newElements };
        });
      },

      moveDown: (id) => {
        set((state) => {
          const index = state.elements.findIndex((e) => e.id === id);
          if (index <= 0) return state;
          const newElements = [...state.elements];
          [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
          return { elements: newElements };
        });
      },

      reorderElements: (newOrder) => {
        set({ elements: newOrder });
      },

      undo: () => {
        set((state) => {
          const previous = state.history.past[state.history.past.length - 1];
          if (!previous) return state;
          const newPast = state.history.past.slice(0, -1);
          return {
            elements: previous.elements,
            backgroundColor: previous.backgroundColor,
            history: {
              past: newPast,
              future: [makeSnapshot(state), ...state.history.future],
            },
          };
        });
      },

      redo: () => {
        set((state) => {
          const next = state.history.future[0];
          if (!next) return state;
          const newFuture = state.history.future.slice(1);
          return {
            elements: next.elements,
            backgroundColor: next.backgroundColor,
            history: {
              past: [...state.history.past, makeSnapshot(state)],
              future: newFuture,
            },
          };
        });
      },

      save: () => {
        set({ isSaving: true, lastSaved: Date.now() });
        setTimeout(() => set({ isSaving: false }), 600);
      },

      load: () => {
        // Handled by persist middleware
      },

      reset: () => {
        if (window.confirm('모든 작업을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
          set({
            title: 'Untitled',
            elements: [],
            selectedIds: [],
            backgroundColor: '#FFFFFF',
            history: { past: [], future: [] },
            lastSaved: null,
          });
        }
      },
    }),
    {
      name: 'poster-editor-storage',
      partialize: (state) => ({
        elements: state.elements,
        themeColor: state.themeColor,
        backgroundColor: state.backgroundColor,
        format: state.format,
        title: state.title,
        lastSaved: state.lastSaved,
      }),
    }
  )
);