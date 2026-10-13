import { combineReducers } from '@reduxjs/toolkit';
import uiReducer from './slices/ui-slice';
import authReducer from './slices/auth-slice';

export const rootReducer = combineReducers({
  ui: uiReducer,
  auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
