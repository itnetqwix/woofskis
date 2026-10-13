import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { AuthUser } from '@/types/auth';
import { STORAGE_KEYS } from '@/constants/storage-keys';

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: AuthUser; token?: string | null }>) => {
      const token = action.payload.token ?? null;
      state.user = action.payload.user;
      state.token = token;
      state.isAuthenticated = Boolean(token) && action.payload.user.role !== 'GUEST';
      state.isLoading = false;

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(action.payload.user));
          if (token) {
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
          } else {
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          }
          window.dispatchEvent(
            new CustomEvent('cos_auth_updated', {
              detail: { user: action.payload.user, token },
            })
          );
        } catch (err) {
          console.error('Error saving auth state to localStorage:', err);
        }
      }
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(state.user));
            window.dispatchEvent(
              new CustomEvent('cos_auth_updated', {
                detail: { user: state.user, token: state.token },
              })
            );
          } catch (err) {
            console.error('Error updating user in localStorage:', err);
          }
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          window.dispatchEvent(
            new CustomEvent('cos_auth_updated', {
              detail: { user: null, token: null },
            })
          );
        } catch (err) {
          console.error('Error clearing auth from localStorage:', err);
        }
      }
    },
  },
});

export const { setCredentials, setAuthLoading, updateUser, logout } = authSlice.actions;

export default authSlice.reducer;
