import { Link } from 'react-router-dom';

export default function SectionHeader({ eyebrow, title, subtitle, link, linkLabel = 'View all' }) {
    return (
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div>
                {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
                <h2 className="section-title h3 mb-1">{title}</h2>
                {subtitle && <p className="text-soft mb-0">{subtitle}</p>}
            </div>
            {link && <Link to={link} className="btn btn-outline-primary rounded-pill btn-sm">{linkLabel} <i className="mdi mdi-arrow-right" /></Link>}
        </div>
    );
}
