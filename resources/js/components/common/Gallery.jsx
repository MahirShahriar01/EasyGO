import { useEffect, useState } from 'react';
import Img from './Img';

/** Mosaic photo grid with a keyboard-navigable lightbox. */
export default function Gallery({ images = [], alt = '' }) {
    const [open, setOpen] = useState(null);
    const list = images.length ? images : [null];

    useEffect(() => {
        if (open === null) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(null);
            if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % list.length);
            if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + list.length) % list.length);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, list.length]);

    return (
        <>
            <div className={`gallery-grid n${Math.min(5, list.length)}`}>
                {list.slice(0, 5).map((src, i) => (
                    <div key={i} className="position-relative">
                        <Img src={src} alt={`${alt} photo ${i + 1}`} onClick={() => setOpen(i)} />
                        {i === 4 && list.length > 5 && <span className="position-absolute bottom-0 end-0 m-2 badge text-bg-dark">+{list.length - 5} photos</span>}
                    </div>
                ))}
            </div>
            {open !== null && (
                <div className="lightbox" onClick={() => setOpen(null)}>
                    <button className="btn top-0 end-0 m-3" aria-label="Close"><i className="mdi mdi-close" /></button>
                    {list.length > 1 && <button className="btn start-0 ms-2" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + list.length) % list.length); }} aria-label="Previous"><i className="mdi mdi-chevron-left" /></button>}
                    <Img src={list[open]} alt={alt} onClick={(e) => e.stopPropagation()} />
                    {list.length > 1 && <button className="btn end-0 me-2" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % list.length); }} aria-label="Next"><i className="mdi mdi-chevron-right" /></button>}
                    <span className="position-absolute bottom-0 mb-3 text-white small">{open + 1} / {list.length}</span>
                </div>
            )}
        </>
    );
}
