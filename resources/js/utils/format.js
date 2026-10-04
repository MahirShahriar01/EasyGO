/** Formatting helpers shared by the customer site and admin panel. */
import { store } from '../store';

const settings = () => store.getState().settings;

/** All times are shown in the platform timezone (e.g. a flight's local departure time), not the viewer's. */
const tz = () => settings().timezone || undefined;

/** "৳12,500" (or "৳12,500.50" when there are paisa). */
export function money(value, { decimals } = {}) {
    const n = Number(value || 0);
    const d = decimals ?? (Number.isInteger(n) ? 0 : 2);
    return `${settings().currency_symbol ?? ''}${n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}

export const compact = (n) => Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

export function date(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
    if (!value) return '—';
    // Plain dates (YYYY-MM-DD) have no time component: format them as-is, without timezone shifting.
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
    }
    return new Date(value).toLocaleDateString('en-GB', { ...opts, timeZone: tz() });
}

export const time = (value) => (value ? new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz() }) : '—');

/** ISO timestamp → "YYYY-MM-DDTHH:mm" in the platform timezone, for <input type="datetime-local">. */
export function toInputDateTime(value) {
    if (!value) return '';
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: tz(), year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(value)).map((p) => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export const dateTime = (value) => (value ? `${date(value)} · ${time(value)}` : '—');

export function duration(minutes) {
    const h = Math.floor((minutes || 0) / 60);
    const m = (minutes || 0) % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
}

/** YYYY-MM-DD in local time, offset by n days from today. */
export function isoDate(offsetDays = 0, from = new Date()) {
    const d = new Date(from);
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const nightsBetween = (a, b) => (a && b ? Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000)) : 0);

export const relative = (value) => {
    const diff = (Date.now() - new Date(value).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date(value);
};

export const titleCase = (s = '') => s.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const STATUS_BADGE = {
    pending: 'warning', confirmed: 'success', completed: 'primary', cancelled: 'danger',
    paid: 'success', unpaid: 'secondary', refunded: 'info', active: 'success', inactive: 'secondary',
    blocked: 'danger', approved: 'success', rejected: 'danger', new: 'primary', read: 'secondary', replied: 'success',
    running: 'success', paused: 'warning', draft: 'secondary', scheduled: 'info', expired: 'dark', budget_reached: 'danger',
};

export const SERVICE_ICON = { hotel: 'mdi-bed', flight: 'mdi-airplane', bus: 'mdi-bus', tour: 'mdi-island', car: 'mdi-car' };
