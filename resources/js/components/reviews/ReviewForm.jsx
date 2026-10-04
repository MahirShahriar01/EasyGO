import { useState } from 'react';
import { toast } from 'react-toastify';
import api, { fieldError } from '../../api/client';
import Stars from '../common/Stars';

/** Post-trip review form (shown on confirmed / completed bookings). */
export default function ReviewForm({ target, onDone }) {
    const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        try {
            const { data } = await api.post('/reviews', { ...form, type: target.type, id: target.id });
            toast.success(data.message);
            onDone?.();
        } catch (err) {
            setErrors(err.fieldErrors);
            toast.error(fieldError(err.fieldErrors, 'rating') || err.userMessage);
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <div className="mb-3">
                <label className="form-label d-block">Your rating</label>
                <Stars value={form.rating} size="1.8rem" onChange={(rating) => setForm({ ...form, rating })} />
            </div>
            <div className="mb-3">
                <label className="form-label" htmlFor="rv-title">Title</label>
                <input id="rv-title" className="form-control" maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Sum up your experience" />
            </div>
            <div className="mb-3">
                <label className="form-label" htmlFor="rv-comment">Review</label>
                <textarea id="rv-comment" rows="4" className={`form-control ${errors.comment ? 'is-invalid' : ''}`} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="What did you like? What could be better?" required minLength={10} />
                <div className="invalid-feedback">{fieldError(errors, 'comment')}</div>
            </div>
            <button className="btn btn-gradient" disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</button>
        </form>
    );
}
