import { clickHref } from './adApi';

/** Renders one creative (image or video), wrapped in the tracking link when the ad has a target URL. */
export default function AdCreative({ ad, video = {}, className = '', style, onError }) {
    const media = ad.media_type === 'video' ? (
        <video
            src={ad.media_src}
            poster={ad.poster_src || undefined}
            className={className}
            style={style}
            autoPlay
            muted
            playsInline
            loop={video.loop ?? true}
            onEnded={video.onEnded}
            onTimeUpdate={video.onTimeUpdate}
            ref={video.ref}
            onError={onError}
        />
    ) : (
        <img src={ad.media_src} alt={ad.headline || ad.title} className={className} style={style} loading="lazy" onError={onError} />
    );

    const href = clickHref(ad);
    if (!href) return media;

    return (
        <a href={href} target={ad.open_in_new_tab ? '_blank' : undefined} rel="sponsored noopener" aria-label={ad.headline || ad.title}>
            {media}
        </a>
    );
}
