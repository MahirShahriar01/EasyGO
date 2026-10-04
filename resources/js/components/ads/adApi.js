/**
 * Client for the self-hosted ad server.
 *
 * Several <AdSlot>s usually mount on the same page; their zone requests are
 * batched into a single GET /api/ads/serve?zones[]=a&zones[]=b call.
 */
import api from '../../api/client';
import { deviceType, viewerId } from '../../utils/viewer';

let queue = [];
let timer = null;

export function fetchZone(zone) {
    return new Promise((resolve) => {
        queue.push({ zone, resolve });
        if (!timer) {
            timer = setTimeout(flush, 25);
        }
    });
}

async function flush() {
    const batch = queue;
    queue = [];
    timer = null;
    const zones = [...new Set(batch.map((b) => b.zone))];

    try {
        const { data } = await api.get('/ads/serve', { params: { zones, viewer: viewerId(), device: deviceType() } });
        batch.forEach((b) => b.resolve(data?.[b.zone] ?? null));
    } catch {
        batch.forEach((b) => b.resolve(null)); // ads must never break the page
    }
}

/** Fire-and-forget tracking for impression / skip / close / complete. Clicks go through the redirect URL. */
export function track(adId, event, zone) {
    api.post(`/ads/${adId}/events`, { event, zone, viewer: viewerId(), device: deviceType() }).catch(() => {});
}

/** Tracking redirect URL with viewer + device appended. */
export function clickHref(ad) {
    if (!ad.click_url) return null;
    const sep = ad.click_url.includes('?') ? '&' : '?';
    return `${ad.click_url}${sep}v=${encodeURIComponent(viewerId() ?? '')}&d=${deviceType()}`;
}

const closedKey = (zone) => `easygo.ad.closed.${zone}`;

export function wasClosed(zone, adId) {
    try { return JSON.parse(sessionStorage.getItem(closedKey(zone)) || '[]').includes(adId); } catch { return false; }
}

export function markClosed(zone, adId) {
    try {
        const ids = JSON.parse(sessionStorage.getItem(closedKey(zone)) || '[]');
        sessionStorage.setItem(closedKey(zone), JSON.stringify([...new Set([...ids, adId])]));
    } catch { /* ignore */ }
}
