import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api, { fieldError } from '../api/client';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Contact() {
    useDocumentTitle('Contact us');
    const s = useSelector((st) => st.settings);
    const user = useSelector((st) => st.auth.user);
    const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        try {
            const { data } = await api.post('/contact', form);
            toast.success(data.message);
            setForm({ ...form, subject: '', message: '' });
        } catch (err) {
            setErrors(err.fieldErrors);
            toast.error(err.userMessage);
        } finally {
            setBusy(false);
        }
    };

    const input = (k, label, props = {}) => (
        <div className={props.col || 'col-md-6'}>
            <label className="form-label" htmlFor={k}>{label}</label>
            {props.textarea
                ? <textarea id={k} rows="5" className={`form-control ${errors[k] ? 'is-invalid' : ''}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />
                : <input id={k} type={props.type || 'text'} className={`form-control ${errors[k] ? 'is-invalid' : ''}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />}
            <div className="invalid-feedback">{fieldError(errors, k)}</div>
        </div>
    );

    return (
        <>
            <section className="hero hero-sm bg-gradient-brand" style={{ backgroundImage: 'none' }}>
                <div className="container"><h1 className="h2 fw-800">Contact us</h1><p className="opacity-75 mb-0">We usually reply within a few hours.</p></div>
            </section>
            <div className="container py-5">
                <div className="row g-4">
                    <div className="col-lg-4">
                        {[['mdi-phone-outline', 'Call us', s.contact_phone], ['mdi-email-outline', 'E-mail', s.contact_email], ['mdi-map-marker-outline', 'Visit', s.contact_address]].map(([i, l, v]) => (
                            <div className="card border-0 p-4 mb-3 d-flex flex-row gap-3 align-items-center" key={l}>
                                <span className="feature-icon flex-shrink-0"><i className={`mdi ${i}`} /></span>
                                <div><div className="small text-soft">{l}</div><div className="fw-semibold">{v}</div></div>
                            </div>
                        ))}
                    </div>
                    <div className="col-lg-8">
                        <form className="card border-0 p-4" onSubmit={submit}>
                            <div className="row g-3">
                                {input('name', 'Your name')}
                                {input('email', 'E-mail', { type: 'email' })}
                                {input('subject', 'Subject', { col: 'col-12' })}
                                {input('message', 'Message', { col: 'col-12', textarea: true })}
                                <div className="col-12"><button className="btn btn-gradient" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button></div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
