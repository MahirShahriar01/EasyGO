import { useEffect, useRef, useState } from 'react';
import AdCreative from './AdCreative';
import { fetchZone, markClosed, track, wasClosed } from './adApi';

/**
 * A banner / sidebar / in-feed ad placement.
 *
 *   <AdSlot zone="home_top_banner" />
 *
 * - Renders nothing when the zone has no eligible ad (no empty boxes).
 * - Several ads in the zone rotate as a carousel (zone.rotation_seconds), paused on hover.
 * - An impression is logged once per ad when ≥50% of it is visible.
 * - Closable ads show a × after `skip_after_seconds`; a closed ad stays hidden for the session.
 * - `auto_close_seconds` hides the ad automatically.
 */
export default function AdSlot({ zone, className = '', label = 'Sponsored' }) {
    const [payload, setPayload] = useState(null);
    const [index, setIndex] = useState(0);
    const [hidden, setHidden] = useState(false);
    const [canClose, setCanClose] = useState(false);
    const [paused, setPaused] = useState(false);
    const ref = useRef(null);
    const seen = useRef(new Set());

    useEffect(() => {
        let alive = true;
        fetchZone(zone).then((data) => {
            if (!alive || !data) return;
            const ads = data.ads.filter((a) => !wasClosed(zone, a.id));
            setPayload(ads.length ? { ...data, ads } : null);
        });
        return () => { alive = false; };
    }, [zone]);

    const ads = payload?.ads ?? [];
    const ad = ads[index % (ads.length || 1)];

    // Carousel rotation.
    useEffect(() => {
        if (ads.length < 2 || paused) return undefined;
        const t = setInterval(() => setIndex((i) => (i + 1) % ads.length), (payload.zone.rotation_seconds || 8) * 1000);
        return () => clearInterval(t);
    }, [ads.length, paused, payload]);

    // Viewable impression (IntersectionObserver, 50% threshold).
    useEffect(() => {
        if (!ad || !ref.current) return undefined;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !seen.current.has(ad.id)) {
                seen.current.add(ad.id);
                track(ad.id, 'impression', zone);
            }
        }, { threshold: 0.5 });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [ad, zone]);

    // Close button availability + auto close.
    useEffect(() => {
        if (!ad) return undefined;
        setCanClose(ad.closable && ad.skip_after_seconds === 0);
        const timers = [];
        if (ad.closable && ad.skip_after_seconds > 0) timers.push(setTimeout(() => setCanClose(true), ad.skip_after_seconds * 1000));
        if (ad.auto_close_seconds) timers.push(setTimeout(() => setHidden(true), ad.auto_close_seconds * 1000));
        return () => timers.forEach(clearTimeout);
    }, [ad]);

    if (!ad || hidden) return null;

    const close = () => {
        track(ad.id, 'close', zone);
        markClosed(zone, ad.id);
        if (ads.length > 1) {
            setPayload({ ...payload, ads: ads.filter((a) => a.id !== ad.id) });
            setIndex(0);
        } else {
            setHidden(true);
        }
    };

    return (
        <div
            ref={ref}
            className={`ad-slot ${className}`}
            data-zone={zone}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <span className="ad-label">{label}</span>
            {ad.closable && (
                <button
                    type="button"
                    className="ad-close btn btn-sm btn-dark rounded-pill py-0 px-2 opacity-75"
                    onClick={close}
                    disabled={!canClose}
                    aria-label="Close ad"
                    title={canClose ? 'Close ad' : `You can close this ad in ${ad.skip_after_seconds}s`}
                >
                    {canClose ? <i className="mdi mdi-close" /> : <small>{ad.skip_after_seconds}s</small>}
                </button>
            )}
            <div className="ad-slide" key={ad.id}>
                <AdCreative ad={ad} />
            </div>
            {ads.length > 1 && (
                <div className="ad-dots">
                    {ads.map((a, i) => (
                        <button key={a.id} type="button" className={i === index % ads.length ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Show ad ${i + 1}`} />
                    ))}
                </div>
            )}
        </div>
    );
}
