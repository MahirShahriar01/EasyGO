import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Two-way bind search filters to the URL query string so results are shareable
 * and survive refresh. Array values are stored as repeated keys (?stars=4&stars=5).
 */
export default function useQueryState(defaults = {}) {
    const [params, setParams] = useSearchParams();

    const state = useMemo(() => {
        const out = { ...defaults };
        for (const key of new Set(params.keys())) {
            const all = params.getAll(key);
            out[key] = Array.isArray(defaults[key]) ? all : all[0];
        }
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    const update = useCallback((patch, { resetPage = true } = {}) => {
        const next = new URLSearchParams(params);
        Object.entries(patch).forEach(([k, v]) => {
            next.delete(k);
            if (Array.isArray(v)) v.forEach((x) => next.append(k, x));
            else if (v !== undefined && v !== null && v !== '' && v !== false) next.set(k, v);
        });
        if (resetPage && !('page' in patch)) next.delete('page');
        setParams(next, { replace: false });
    }, [params, setParams]);

    /** API params: drop empty values (axios serialises arrays as key[]=a&key[]=b for Laravel). */
    const apiParams = useMemo(() => {
        const out = {};
        Object.entries(state).forEach(([k, v]) => {
            if (Array.isArray(v)) { if (v.length) out[k] = v; }
            else if (v !== undefined && v !== '') out[k] = v;
        });
        return out;
    }, [state]);

    return [state, update, apiParams];
}
