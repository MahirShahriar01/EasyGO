import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/client';

/**
 * Fetch JSON from the API and track loading/error state.
 * Re-fetches whenever `url` or the serialised `params` change; stale responses are ignored.
 *
 *   const { data, loading, error, reload, setData } = useApi('/hotels', { q });
 */
export default function useApi(url, params = undefined, { enabled = true } = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(Boolean(url) && enabled);
    const [error, setError] = useState(null);
    const requestId = useRef(0);
    const key = JSON.stringify(params ?? {});

    const load = useCallback(async () => {
        if (!url || !enabled) return;
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(url, { params: JSON.parse(key) });
            if (id === requestId.current) setData(res.data);
        } catch (e) {
            if (id === requestId.current) setError(e.userMessage);
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [url, key, enabled]);

    useEffect(() => { load(); }, [load]);

    return { data, loading, error, reload: load, setData };
}
