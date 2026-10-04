import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { fieldError } from '../../api/client';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import AuthCard from './AuthCard';

export default function ResetPassword() {
    useDocumentTitle('Choose a new password');
    const { token } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: params.get('email') || '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await api.post('/auth/reset-password', { ...form, token });
            toast.success(data.message);
            navigate('/login');
        } catch (err) {
            setErrors(err.fieldErrors);
            toast.error(err.userMessage);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthCard title="Choose a new password">
            <form onSubmit={submit}>
                {['email', 'password', 'password_confirmation'].map((k) => (
                    <div className="mb-3" key={k}>
                        <label className="form-label" htmlFor={k}>{{ email: 'E-mail', password: 'New password', password_confirmation: 'Confirm new password' }[k]}</label>
                        <input id={k} type={k === 'email' ? 'email' : 'password'} className={`form-control ${errors[k] ? 'is-invalid' : ''}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />
                        <div className="invalid-feedback">{fieldError(errors, k)}</div>
                    </div>
                ))}
                <button className="btn btn-gradient btn-lg w-100" disabled={busy}>{busy ? 'Saving…' : 'Reset password'}</button>
            </form>
            <p className="text-center small mt-4 mb-0"><Link to="/login">Back to sign in</Link></p>
        </AuthCard>
    );
}
