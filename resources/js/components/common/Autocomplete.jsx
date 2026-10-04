import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import useDebounce from '../../hooks/useDebounce';

/** Text input with server-side suggestions (destinations, flight / bus cities). */
export default function Autocomplete({ value, onChange, type = 'destination', placeholder, icon, name, required }) {
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const query = useDebounce(value, 220);
    const box = useRef(null);
    const typed = useRef(false);

    useEffect(() => {
        if (!typed.current || !query || query.length < 1) { setItems([]); return; }
        let alive = true;
        api.get('/suggest', { params: { q: query, type } }).then(({ data }) => alive && setItems(data)).catch(() => {});
        return () => { alive = false; };
    }, [query, type]);

    useEffect(() => {
        const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const pick = (item) => { onChange(item.value); setOpen(false); typed.current = false; };

    return (
        <div className="position-relative" ref={box}>
            <div className="d-flex align-items-center gap-2">
                {icon && <i className={`mdi ${icon} text-primary`} />}
                <input
                    name={name}
                    value={value}
                    required={required}
                    autoComplete="off"
                    placeholder={placeholder}
                    onChange={(e) => { typed.current = true; onChange(e.target.value); setOpen(true); setActive(-1); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (!items.length) return;
                        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
                        if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
                        if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(items[active]); }
                    }}
                />
            </div>
            {open && items.length > 0 && (
                <div className="autocomplete-menu list-group shadow">
                    {items.map((item, i) => (
                        <button type="button" key={item.label} className={`list-group-item list-group-item-action ${i === active ? 'active' : ''}`} onMouseDown={() => pick(item)}>
                            <i className="mdi mdi-map-marker-outline me-2" />{item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
