import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { getToken, setToken } from '../api/client';

/** Restore the session from a stored token on app start. */
export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
    if (!getToken()) return rejectWithValue(null);
    try {
        const { data } = await api.get('/auth/me');
        return data;
    } catch (e) {
        return rejectWithValue(e.userMessage);
    }
});

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/auth/login', credentials);
        setToken(data.token);
        return data;
    } catch (e) {
        return rejectWithValue({ message: e.userMessage, errors: e.fieldErrors });
    }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/auth/register', payload);
        setToken(data.token);
        return data;
    } catch (e) {
        return rejectWithValue({ message: e.userMessage, errors: e.fieldErrors });
    }
});

export const logout = createAsyncThunk('auth/logout', async () => {
    try { await api.post('/auth/logout'); } catch { /* token may already be invalid */ }
    setToken(null);
});

const authSlice = createSlice({
    name: 'auth',
    initialState: { user: null, stats: null, status: getToken() ? 'loading' : 'guest' },
    reducers: {
        setUser(state, action) { state.user = action.payload; },
        sessionExpired(state) { state.user = null; state.stats = null; state.status = 'guest'; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload.user; s.stats = a.payload.stats; s.status = 'authenticated'; })
            .addCase(fetchMe.rejected, (s) => { s.user = null; s.status = 'guest'; })
            .addCase(login.fulfilled, (s, a) => { s.user = a.payload.user; s.status = 'authenticated'; })
            .addCase(register.fulfilled, (s, a) => { s.user = a.payload.user; s.status = 'authenticated'; })
            .addCase(logout.fulfilled, (s) => { s.user = null; s.stats = null; s.status = 'guest'; });
    },
});

export const { setUser, sessionExpired } = authSlice.actions;
export const selectUser = (state) => state.auth.user;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export default authSlice.reducer;
