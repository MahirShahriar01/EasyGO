import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clickHref, fetchZone, track } from './adApi';

/**
 * Full-screen interstitial ad (AdMob style), fully controlled from the admin panel:
 *
 *  - skip_after_seconds  → "Skip in 5…4…3" countdown before the viewer may close it
 *  - closable = false    → no close button; the ad dismisses itself after auto_close_seconds
 *  - auto_close_seconds  → progress bar + automatic dismissal
 *  - video creatives autoplay muted with an unmute toggle; "complete" is tracked on end
 *
 * Shown at most once per browser session per zone (sessionStorage), on top of the
 * server-side per-viewer daily frequency cap.
 */
export default function InterstitialAd({ zone, delay = 1200, oncePerSession = true }) {
    const [ad, setAd] = useState(null);
    const [remaining, setRemaining] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [muted, setMuted] = useState(true);
    const videoRef = useRef(null);
    const finished = useRef(false);
    const sessionKey = `easygo.interstitial.${zone}`;

    useEffect(() => {
        try { if (oncePerSession && sessionStorage.getItem(sessionKey)) return undefined; } catch { /* ignore */ }
        let alive = true;
        const t = setTimeout(() => {
            fetchZone(zone).then((data) => {
                const first = data?.ads?.[0];
                if (!alive || !first) return;
                setAd(first);
                setRemaining(first.closable ? first.skip_after_seconds : 0);
                track(first.id, 'impression', zone);
                try { sessionStorage.setItem(sessionKey, '1'); } catch { /* ignore */ }
            });
        }, delay);
        return () => { alive = false; clearTimeout(t); };
    }, [zone, delay, oncePerSession, sessionKey]);

    const dismiss = useCallback((event) => {
        if (!ad) return;
        track(ad.id, event, zone);
        setAd(null);
    }, [ad, zone]);

    // One-second ticker drives the skip countdown and the auto-close progress.
    useEffect(() => {
        if (!ad) return undefined;
        document.body.style.overflow = 'hidden';
        const t = setInterval(() => {
            setRemaining((r) => Math.max(0, r - 1));
            setElapsed((e) => e + 1);
        }, 1000);
        return () => { clearInterval(t); document.body.style.overflow = ''; };
    }, [ad]);

    useEffect(() => {
        if (ad?.auto_close_seconds && elapsed >= ad.auto_close_seconds) {
            finished.current = true;
            dismiss('complete');
        }
    }, [elapsed, ad, dismiss]);

    const canSkip = ad?.closable && remaining === 0;

    useEffect(() => {
        if (!canSkip) return undefined;
        const onKey = (e) => e.key === 'Escape' && dismiss(finished.current ? 'close' : 'skip');
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [canSkip, dismiss]);

    if (!ad) return null;

    const href = clickHref(ad);
    const progress = ad.auto_close_seconds ? Math.min(100, (elapsed / ad.auto_close_seconds) * 100) : 0;

    return createPortal(
        <div className="ad-interstitial" role="dialog" aria-modal="true" aria-label="Advertisement">
            <div className="ad-box">
                <div className="ad-topbar">
                    <span className="badge text-bg-dark bg-opacity-75">Ad · {ad.advertiser || 'Sponsored'}</span>
                    <div className="d-flex gap-2">
                        {ad.media_type === 'video' && (
                            <button type="button" className="ad-skip" onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }} aria-label={muted ? 'Unmute' : 'Mute'}>
                                <i className={`mdi ${muted ? 'mdi-volume-off' : 'mdi-volume-high'}`} />
                            </button>
                        )}
                        {ad.closable && (
                            <button type="button" className="ad-skip" disabled={!canSkip} onClick={() => dismiss(finished.current ? 'close' : 'skip')}>
                                {canSkip
                                    ? <>{ad.media_type === 'video' && !finished.current ? 'Skip ad' : 'Close'} <i className="mdi mdi-close" /></>
                                    : <>You can skip in {remaining}s</>}
                            </button>
                        )}
                    </div>
                </div>

                {ad.media_type === 'video' ? (
                    <video
                        ref={videoRef}
                        className="ad-media"
                        src={ad.media_src}
                        poster={ad.poster_src || undefined}
                        autoPlay
                        muted
                        playsInline
                        onEnded={() => { finished.current = true; track(ad.id, 'complete', zone); setRemaining(0); }}
                    />
                ) : (
                    <img className="ad-media" src={ad.media_src} alt={ad.headline || ad.title} />
                )}

                {(ad.headline || href) && (
                    <div className="ad-cta d-flex align-items-center justify-content-between gap-3 text-white">
                        <div className="fw-bold">{ad.headline}</div>
                        {href && (
                            <a className="btn btn-light btn-sm rounded-pill fw-bold flex-shrink-0" href={href} target={ad.open_in_new_tab ? '_blank' : undefined} rel="sponsored noopener">
                                {ad.cta_label || 'Learn more'} <i className="mdi mdi-arrow-right" />
                            </a>
                        )}
                    </div>
                )}
                {ad.auto_close_seconds ? <div className="ad-progress" style={{ width: `${progress}%` }} /> : null}
            </div>
        </div>,
        document.body,
    );
}
