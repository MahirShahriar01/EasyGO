/** Anonymous, persistent browser id used for ad frequency capping (no personal data). */
export function viewerId() {
    try {
        let id = localStorage.getItem('easygo.viewer');
        if (!id) {
            id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^a-z0-9-]/gi, '');
            localStorage.setItem('easygo.viewer', id);
        }
        return id;
    } catch {
        return null;
    }
}

export const deviceType = () => (window.matchMedia('(max-width: 767px)').matches || /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop');

/** Recently viewed items (local only), newest first, max 8. */
export function pushRecentlyViewed(item) {
    try {
        const list = JSON.parse(localStorage.getItem('easygo.recent') || '[]').filter((x) => !(x.type === item.type && x.id === item.id));
        localStorage.setItem('easygo.recent', JSON.stringify([item, ...list].slice(0, 8)));
    } catch { /* ignore */ }
}

export function recentlyViewed() {
    try { return JSON.parse(localStorage.getItem('easygo.recent') || '[]'); } catch { return []; }
}
