import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import AuthCard from './AuthCard';

export default function ForgotPassword() {
    useDocumentTitle('Forgot password');
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(null);
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            setSent(data.message);
        } catch (err) {
            setSent(err.userMessage);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthCard title="Reset your password" subtitle="Enter your e-mail and we'll send you a reset link.">
            {sent ? <div className="alert alert-success">{sent}</div> : (
                <form onSubmit={submit}>
                    <label className="form-label" htmlFor="email">E-mail</label>
                    <input id="email" type="email" className="form-control form-control-lg mb-3" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <button className="btn btn-gradient btn-lg w-100" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
                </form>
            )}
            <p className="text-center small mt-4 mb-0"><Link to="/login"><i className="mdi mdi-arrow-left" /> Back to sign in</Link></p>
        </AuthCard>
    );
}
