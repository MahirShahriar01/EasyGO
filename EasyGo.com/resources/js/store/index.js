import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import settings from './settingsSlice';
import ui from './uiSlice';
import wishlist from './wishlistSlice';

/** Global Redux store (Redux Toolkit). Server data for pages is fetched locally with useApi. */
export const store = configureStore({
    reducer: { auth, settings, ui, wishlist },
});
