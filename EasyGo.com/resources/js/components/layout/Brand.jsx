import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function Brand({ to = '/', className = '' }) {
    const name = useSelector((s) => s.settings.site_name);
    return (
        <Link to={to} className={`brand-logo navbar-brand text-decoration-none ${className}`}>
            <span className="mark"><i className="mdi mdi-airplane-takeoff" /></span>
            <span>{name}</span>
        </Link>
    );
}
