import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { Spinner } from '../../components/common/Feedback';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { fetchSettings } from '../../store/settingsSlice';
import { PageHeader } from '../components/AdminUI';
import FormField from '../components/FormField';

const TABS = {
    General: [
        { name: 'site_name', label: 'Site name', required: true, col: 'col-md-6' },
        { name: 'site_tagline', label: 'Tagline', col: 'col-md-6' },
        { name: 'about_text', label: 'About text (footer & About page)', type: 'textarea', rows: 3 },
        { name: 'hero_title', label: 'Home hero title' },
        { name: 'hero_subtitle', label: 'Home hero subtitle' },
        { name: 'hero_image', label: 'Home hero background', type: 'image', folder: 'site' },
    ],
    'Money & bookings': [
        { name: 'currency', label: 'Currency code', required: true, col: 'col-md-3' },
        { name: 'currency_symbol', label: 'Symbol', required: true, col: 'col-md-3' },
        { name: 'tax_rate', label: 'Tax / VAT %', type: 'number', required: true, col: 'col-md-3' },
        { name: 'service_fee_percent', label: 'Service fee %', type: 'number', required: true, col: 'col-md-3' },
        { name: 'booking_hold_minutes', label: 'Unpaid booking hold (minutes)', type: 'number', col: 'col-md-6', help: 'Pending bookings are released after this time.' },
        { name: 'pay_at_property_enabled', label: 'Pay at property', type: 'switch', switchLabel: 'Allow “pay at property” for hotels', col: 'col-md-6' },
        { name: 'auto_approve_reviews', label: 'Reviews', type: 'switch', switchLabel: 'Publish reviews without moderation', col: 'col-md-6' },
    ],
    Advertising: [
        { name: 'ads_enabled', label: 'Ad delivery', type: 'switch', switchLabel: 'Serve ads on the customer site (global kill-switch)' },
    ],
    'Contact & social': [
        { name: 'contact_email', label: 'Support e-mail', type: 'email', col: 'col-md-6' },
        { name: 'contact_phone', label: 'Support phone', col: 'col-md-6' },
        { name: 'contact_address', label: 'Address' },
        { name: 'facebook_url', label: 'Facebook', col: 'col-md-6' },
        { name: 'instagram_url', label: 'Instagram', col: 'col-md-6' },
        { name: 'twitter_url', label: 'X / Twitter', col: 'col-md-6' },
        { name: 'youtube_url', label: 'YouTube', col: 'col-md-6' },
    ],
};
const SWITCHES = ['pay_at_property_enabled', 'auto_approve_reviews', 'ads_enabled'];

export default function Settings() {
    useDocumentTitle('Settings');
    const dispatch = useDispatch();
    const { data, loading } = useApi('/admin/settings');
    const [tab, setTab] = useState('General');
    const [form, setForm] = useState({});
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (data) setForm({ ...data, ...Object.fromEntries(SWITCHES.map((k) => [k, data[k] === '1'])) });
    }, [data]);

    if (loading || !data) return <Spinner />;

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        const keys = Object.values(TABS).flat().map((f) => f.name);
        const payload = Object.fromEntries(keys.map((k) => [k, SWITCHES.includes(k) ? (form[k] ? '1' : '0') : form[k]]));
        try {
            const { data: res } = await api.put('/admin/settings', payload);
            toast.success(res.message);
            dispatch(fetchSettings());
        } catch (err) {
            setErrors(Object.fromEntries(Object.entries(err.fieldErrors || {}).map(([k, v]) => [k, v[0]])));
            toast.error(err.userMessage);
        } finally { setBusy(false); }
    };

    return (
        <form onSubmit={save}>
            <PageHeader title="Platform settings" icon="mdi-cog-outline" actions={<button className="btn btn-gradient" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>} />
            <div className="row g-4">
                <div className="col-lg-3">
                    <div className="list-group account-nav card border-0 p-2">
                        {Object.keys(TABS).map((t) => <button type="button" key={t} className={`list-group-item list-group-item-action ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
                    </div>
                </div>
                <div className="col-lg-9">
                    <div className="card border-0 p-4">
                        <div className="row g-3">
                            {TABS[tab].map((f) => <FormField key={f.name} field={f} value={form[f.name]} error={errors[f.name]} onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))} />)}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
