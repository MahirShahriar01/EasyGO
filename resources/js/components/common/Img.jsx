import { useState } from 'react';

const FALLBACK = '/images/placeholder.svg';

/** <img> with lazy loading and a local placeholder when the source fails (offline demos, broken URLs). */
export default function Img({ src, alt = '', className = '', ...rest }) {
    const [failed, setFailed] = useState(false);
    return (
        <img
            src={!src || failed ? FALLBACK : src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className={className}
            onError={() => setFailed(true)}
            {...rest}
        />
    );
}
