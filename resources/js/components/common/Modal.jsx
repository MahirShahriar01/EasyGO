import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/** Lightweight controlled Bootstrap modal (no jQuery / Bootstrap JS needed). */
export default function Modal({ show, onClose, title, children, footer, size = '', centered = true }) {
    useEffect(() => {
        if (!show) return undefined;
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        document.addEventListener('keydown', onKey);
        document.body.classList.add('modal-open');
        return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); };
    }, [show, onClose]);

    if (!show) return null;

    return createPortal(
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
                <div className={`modal-dialog ${centered ? 'modal-dialog-centered' : ''} modal-dialog-scrollable ${size}`}>
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        {title && (
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">{title}</h5>
                                <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
                            </div>
                        )}
                        <div className="modal-body">{children}</div>
                        {footer && <div className="modal-footer">{footer}</div>}
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>,
        document.body,
    );
}

/** Promise-free confirm dialog. */
export function ConfirmModal({ show, title = 'Are you sure?', message, confirmLabel = 'Confirm', variant = 'danger', busy, onConfirm, onClose, children }) {
    return (
        <Modal show={show} onClose={onClose} title={title} footer={(
            <>
                <button className="btn btn-light" onClick={onClose} disabled={busy}>Cancel</button>
                <button className={`btn btn-${variant}`} onClick={onConfirm} disabled={busy}>
                    {busy && <span className="spinner-border spinner-border-sm me-2" />}{confirmLabel}
                </button>
            </>
        )}>
            {message && <p className="mb-0">{message}</p>}
            {children}
        </Modal>
    );
}
