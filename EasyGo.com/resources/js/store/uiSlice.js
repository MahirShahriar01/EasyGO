import { createSlice } from '@reduxjs/toolkit';

const readTheme = () => {
    try { return localStorage.getItem('easygo.theme') || 'light'; } catch { return 'light'; }
};

/** UI preferences: colour theme and the admin sidebar state. */
const uiSlice = createSlice({
    name: 'ui',
    initialState: { theme: readTheme(), sidebarOpen: false },
    reducers: {
        toggleTheme(state) {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-bs-theme', state.theme);
            try { localStorage.setItem('easygo.theme', state.theme); } catch { /* ignore */ }
        },
        toggleSidebar(state, action) {
            state.sidebarOpen = action.payload ?? !state.sidebarOpen;
        },
    },
});

export const { toggleTheme, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
