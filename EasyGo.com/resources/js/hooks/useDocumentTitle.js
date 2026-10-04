import { useEffect } from 'react';
import { useSelector } from 'react-redux';

/** Sets the browser tab title as "<title> · <site name>". */
export default function useDocumentTitle(title) {
    const site = useSelector((s) => s.settings.site_name);
    useEffect(() => {
        document.title = title ? `${title} · ${site}` : `${site} — ${window.__EASYGO__?.settings?.site_tagline ?? ''}`;
    }, [title, site]);
}
