import { Link } from 'react-router-dom';
import { ErrorState, Spinner } from '../../components/common/Feedback';
import Img from '../../components/common/Img';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { compact, date, money, relative, SERVICE_ICON, titleCase } from '../../utils/format';
import { KpiCard, PageHeader, StatusBadge } from '../components/AdminUI';
import { BarChart, DoughnutChart, LineChart } from '../components/Charts';
import { previewUrl } from '../components/MediaInput';

export default function Dashboard() {
    useDocumentTitle('Admin dashboard');
    const { data, loading, error, reload } = useApi('/admin/dashboard');
    const { data: ads } = useApi('/admin/ads/overview', { days: 30 });

    if (loading && !data) return <Spinner />;
    if (error) return <ErrorState message={error} onRetry={reload} />;
    const k = data.kpis;
    const labels = data.series.map((s) => date(s.date, { day: 'numeric', month: 'short' }));

    return (
        <>
            <PageHeader title="Dashboard" subtitle="Business performance at a glance" icon="mdi-view-dashboard-outline" actions={<button className="btn btn-light" onClick={reload}><i className="mdi mdi-refresh" /> Refresh</button>} />

            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-xl-3"><KpiCard label="Revenue (this month)" value={money(k.revenue_month)} icon="mdi-cash-multiple" color="success"
                    hint={k.revenue_growth !== null && <span className={k.revenue_growth >= 0 ? 'text-success' : 'text-danger'}><i className={`mdi mdi-trending-${k.revenue_growth >= 0 ? 'up' : 'down'}`} /> {k.revenue_growth}% vs last month</span>} /></div>
                <div className="col-sm-6 col-xl-3"><KpiCard label="Total bookings" value={compact(k.bookings_total)} icon="mdi-ticket-confirmation-outline" hint={<span className="text-soft">{k.bookings_today} today · {k.bookings_pending} pending</span>} /></div>
                <div className="col-sm-6 col-xl-3"><KpiCard label="Customers" value={compact(k.customers)} icon="mdi-account-group" color="info" hint={<span className="text-soft">+{k.new_customers_month} this month</span>} /></div>
                <div className="col-sm-6 col-xl-3"><KpiCard label="Ad impressions (30d)" value={compact(k.ad_impressions_30d)} icon="mdi-bullhorn-outline" color="warning" hint={<span className="text-soft">CTR {k.ad_ctr_30d}% · {k.ads_running} running</span>} /></div>
            </div>

            <div className="row g-3 mb-4">
                {[[k.reviews_pending, 'reviews awaiting moderation', '/admin/reviews?status=pending', 'mdi-star-half-full', 'warning'],
                    [k.messages_new, 'new support messages', '/admin/messages', 'mdi-message-alert-outline', 'danger'],
                    [k.bookings_pending, 'unpaid pending bookings', '/admin/bookings?status=pending', 'mdi-timer-sand', 'info']].map(([n, l, to, icon, c]) => (
                    <div className="col-md-4" key={l}>
                        <Link to={to} className={`alert alert-${c} d-flex align-items-center gap-2 mb-0 text-decoration-none`}><i className={`mdi ${icon} fs-4`} /><span><strong>{n}</strong> {l}</span><i className="mdi mdi-chevron-right ms-auto" /></Link>
                    </div>
                ))}
            </div>

            <div className="row g-4 mb-4">
                <div className="col-xl-8">
                    <div className="card border-0 h-100">
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">Revenue & bookings — last 30 days</h6>
                            <LineChart labels={labels} height={300}
                                datasets={[{ label: 'Revenue', data: data.series.map((s) => s.revenue), yAxisID: 'y' }, { label: 'Bookings', data: data.series.map((s) => s.bookings), yAxisID: 'y1', fill: false, color: '#20c997' }]}
                                options={{ scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { callback: (v) => compact(v) } }, y1: { position: 'right', beginAtZero: true, grid: { display: false } } } }} />
                        </div>
                    </div>
                </div>
                <div className="col-xl-4">
                    <div className="card border-0 h-100">
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">Bookings by service</h6>
                            <DoughnutChart labels={data.by_service.map((s) => titleCase(s.service_type))} data={data.by_service.map((s) => s.bookings)} height={260} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-xl-8">
                    <div className="card border-0 h-100">
                        <div className="card-body pb-0 d-flex justify-content-between"><h6 className="fw-bold">Recent bookings</h6><Link to="/admin/bookings" className="small">View all</Link></div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead><tr><th>Reference</th><th>Customer</th><th>Item</th><th>Total</th><th>Status</th><th>When</th></tr></thead>
                                <tbody>
                                    {data.recent_bookings.map((b) => (
                                        <tr key={b.id}>
                                            <td className="text-nowrap"><Link to={`/admin/bookings/${b.reference}`} className="fw-semibold">{b.reference}</Link></td>
                                            <td>{b.user?.name}</td>
                                            <td className="text-truncate" style={{ maxWidth: 220 }}><i className={`mdi ${SERVICE_ICON[b.service_type]} text-primary`} /> {b.item_name}</td>
                                            <td>{money(b.total)}</td>
                                            <td><StatusBadge value={b.status} /></td>
                                            <td className="small text-soft">{relative(b.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="col-xl-4">
                    <div className="card border-0 h-100">
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">Top rated hotels</h6>
                            {data.top_hotels.map((h) => (
                                <div key={h.id} className="d-flex align-items-center gap-2 mb-3">
                                    <Img src={previewUrl(h.thumbnail || h.images?.[0])} alt="" className="table-thumb" />
                                    <div className="flex-grow-1 min-w-0"><div className="small fw-semibold text-truncate">{h.name}</div><div className="small text-soft">{money(h.min_price)} / night</div></div>
                                    <span className="rating-pill">{(h.avg_rating * 2).toFixed(1)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {ads && (
                <div className="card border-0">
                    <div className="card-body">
                        <div className="d-flex justify-content-between mb-3"><h6 className="fw-bold mb-0">Ad performance — last 30 days</h6><Link to="/admin/ads" className="small">Manage ads</Link></div>
                        <BarChart height={240} labels={ads.daily.map((d) => date(d.date, { day: 'numeric', month: 'short' }))}
                            datasets={[{ label: 'Impressions', data: ads.daily.map((d) => d.impressions) }, { label: 'Clicks', data: ads.daily.map((d) => d.clicks), color: '#fab005' }]} />
                    </div>
                </div>
            )}
        </>
    );
}
