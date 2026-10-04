import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';

/** Public platform settings (branding, currency, contact). Seeded from the Blade shell for a fast first paint. */
export const fetchSettings = createAsyncThunk('settings/fetch', async () => (await api.get('/settings')).data);

const initial = window.__EASYGO__?.settings ?? { site_name: 'EasyGo', currency: 'BDT', currency_symbol: '৳' };

const settingsSlice = createSlice({
    name: 'settings',
    initialState: initial,
    reducers: {
        replaceSettings: (_state, action) => action.payload,
    },
    extraReducers: (b) => b.addCase(fetchSettings.fulfilled, (_s, a) => a.payload),
});

export const { replaceSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
