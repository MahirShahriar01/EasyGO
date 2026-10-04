import { useEffect, useRef, useState } from 'react';

/** Minimal accessible dropdown (no Bootstrap JS dependency). */
export default function Dropdown({ toggle, children, align = 'end', className = '', menuClassName = '' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
    }, []);

    return (
        <div className={`dropdown ${className}`} ref={ref}>
            {toggle({ open, setOpen, onClick: () => setOpen(!open) })}
            {open && (
                <div className={`dropdown-menu show shadow border-0 rounded-4 mt-2 ${align === 'end' ? 'dropdown-menu-end' : ''} ${menuClassName}`}
                    style={{ position: 'absolute', [align === 'end' ? 'right' : 'left']: 0 }}
                    onClick={(e) => e.target.closest('a,button[data-close]') && setOpen(false)}>
                    {children}
                </div>
            )}
        </div>
    );
}
