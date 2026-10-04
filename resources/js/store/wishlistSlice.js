import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';
import { logout, sessionExpired } from './authSlice';

/** Keys like "hotel:12" for items the signed-in user has saved. */
export const fetchWishlistKeys = createAsyncThunk('wishlist/keys', async () => (await api.get('/wishlist/keys')).data);

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async ({ type, id }) => {
    const { data } = await api.post('/wishlist/toggle', { type, id });
    return { key: `${type}:${id}`, saved: data.saved, message: data.message };
});

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: { keys: [] },
    reducers: {},
    extraReducers: (b) => {
        b.addCase(fetchWishlistKeys.fulfilled, (s, a) => { s.keys = a.payload; })
            .addCase(toggleWishlist.fulfilled, (s, a) => {
                s.keys = a.payload.saved ? [...s.keys, a.payload.key] : s.keys.filter((k) => k !== a.payload.key);
            })
            .addCase(logout.fulfilled, (s) => { s.keys = []; })
            .addCase(sessionExpired, (s) => { s.keys = []; });
    },
});

export default wishlistSlice.reducer;
