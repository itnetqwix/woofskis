import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  activeModal: string | null;
  modalData: Record<string, any> | null;
}

const initialState: UiState = {
  sidebarOpen: true,
  commandPaletteOpen: false,
  activeModal: null,
  modalData: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.commandPaletteOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<{ modalId: string; data?: Record<string, any> }>) => {
      state.activeModal = action.payload.modalId;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setCommandPaletteOpen, openModal, closeModal } =
  uiSlice.actions;

export default uiSlice.reducer;
