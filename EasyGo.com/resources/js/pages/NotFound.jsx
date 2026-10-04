import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
    useDocumentTitle('Page not found');
    return (
        <div className="container py-5 text-center min-vh-50 d-flex flex-column justify-content-center">
            <div className="display-1 fw-800 text-gradient">404</div>
            <h1 className="h3 fw-bold">Looks like you took a wrong turn</h1>
            <p className="text-soft">The page you're looking for doesn't exist or has moved.</p>
            <div><Link to="/" className="btn btn-gradient">Back to home</Link></div>
        </div>
    );
}
