/**
 * Axios instance for the EasyGo REST API.
 * - Adds the Sanctum bearer token from localStorage.
 * - Normalises Laravel validation errors into `error.fieldErrors`.
 * - Emits a global "easygo:unauthorized" event on 401 so the store can log out.
 */
import axios from 'axios';

export const TOKEN_KEY = 'easygo.token';

export const getToken = () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

export const setToken = (token) => {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch { /* storage unavailable (private mode) */ }
};

const api = axios.create({
    baseURL: '/api',
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const res = error.response;
        error.fieldErrors = res?.status === 422 ? res.data?.errors ?? {} : {};
        error.userMessage = res?.data?.message
            || (res ? `Request failed (${res.status})` : 'Network error — please check your connection.');

        if (res?.status === 401 && getToken()) {
            setToken(null);
            window.dispatchEvent(new CustomEvent('easygo:unauthorized'));
        }
        return Promise.reject(error);
    },
);

/** First validation message for a field, or undefined. */
export const fieldError = (errors, name) => (errors?.[name] ? errors[name][0] : undefined);

/** Download a file (CSV export) from an authenticated endpoint. */
export async function downloadFile(url, params, fallbackName) {
    const res = await api.get(url, { params, responseType: 'blob' });
    const name = res.headers['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] || fallbackName;
    const href = URL.createObjectURL(res.data);
    const a = Object.assign(document.createElement('a'), { href, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
}

export default api;
