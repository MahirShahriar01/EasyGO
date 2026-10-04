import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Spinner } from '../../components/common/Feedback';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { compact, date, titleCase } from '../../utils/format';
import { KpiCard, PageHeader, StatusBadge } from '../components/AdminUI';
import { BarChart, DoughnutChart, LineChart } from '../components/Charts';
import { CreativeThumb } from './Ads';

/** Per-ad analytics: impressions, clicks, CTR trend, zone & device breakdown, skip/close/complete counts. */
export default function AdStats() {
    const { id } = useParams();
    const [days, setDays] = useState(30);
    const { data, loading } = useApi(`/admin/ads/${id}/stats`, { days });
    useDocumentTitle('Ad analytics');

    if (loading && !data) return <Spinner />;
    const { ad, stats } = data;
    const labels = stats.daily.map((d) => date(d.date, { day: 'numeric', month: 'short' }));

    return (
        <>
            <Link to="/admin/ads" className="small d-inline-block mb-2"><i className="mdi mdi-arrow-left" /> All ads</Link>
            <PageHeader title={ad.title} subtitle={`${ad.advertiser || 'No advertiser'} · ${ad.zones.map((z) => z.name).join(', ')}`} icon="mdi-chart-line"
                actions={<>
                    <StatusBadge value={data.delivery_state} />
                    <select className="form-select form-select-sm w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Period">
                        {[7, 30, 60, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
                    </select>
                    <Link to={`/admin/ads/${ad.id}/edit`} className="btn btn-sm btn-light"><i className="mdi mdi-pencil" /> Edit</Link>
                </>} />

            <div className="row g-3 mb-4">
                <div className="col-6 col-xl-2"><KpiCard label="Impressions" value={compact(stats.impressions)} icon="mdi-eye-outline" /></div>
                <div className="col-6 col-xl-2"><KpiCard label="Clicks" value={compact(stats.clicks)} icon="mdi-cursor-default-click-outline" color="warning" /></div>
                <div className="col-6 col-xl-2"><KpiCard label="CTR" value={`${stats.ctr}%`} icon="mdi-percent-outline" color="success" /></div>
                <div className="col-6 col-xl-2"><KpiCard label="Unique viewers" value={compact(stats.unique_viewers)} icon="mdi-account-eye-outline" color="info" /></div>
                <div className="col-6 col-xl-2"><KpiCard label="Skipped" value={compact(stats.skips)} icon="mdi-skip-next-outline" color="danger" /></div>
                <div className="col-6 col-xl-2"><KpiCard label="Completed" value={compact(stats.completes)} icon="mdi-check-circle-outline" color="success" hint={<span className="text-soft">{compact(stats.closes)} closed</span>} /></div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-xl-8">
                    <div className="card border-0 h-100"><div className="card-body">
                        <h6 className="fw-bold mb-3">Daily performance</h6>
                        <LineChart labels={labels} height={300} datasets={[
                            { label: 'Impressions', data: stats.daily.map((d) => d.impressions), yAxisID: 'y' },
                            { label: 'Clicks', data: stats.daily.map((d) => d.clicks), yAxisID: 'y1', color: '#fab005', fill: false },
                        ]} options={{ scales: { x: { grid: { display: false } }, y: { beginAtZero: true }, y1: { position: 'right', beginAtZero: true, grid: { display: false } } } }} />
                    </div></div>
                </div>
                <div className="col-xl-4">
                    <div className="card border-0 h-100"><div className="card-body">
                        <h6 className="fw-bold mb-3">Creative</h6>
                        <CreativeThumb ad={ad} style={{ width: '100%', height: 'auto', maxHeight: 220 }} />
                        <ul className="small text-soft mt-3 mb-0 ps-3">
                            <li>{ad.closable ? `Closable after ${ad.skip_after_seconds}s` : 'Not closable'}{ad.auto_close_seconds ? ` · auto-close ${ad.auto_close_seconds}s` : ''}</li>
                            <li>Audience {titleCase(ad.audience)} · device {titleCase(ad.device)} · weight {ad.weight}</li>
                            <li>Lifetime: {compact(ad.impressions_count)} impressions{ad.max_impressions ? ` of ${compact(ad.max_impressions)}` : ''}, {compact(ad.clicks_count)} clicks</li>
                            <li>{ad.starts_at ? date(ad.starts_at) : 'Now'} → {ad.ends_at ? date(ad.ends_at) : 'no end date'}</li>
                        </ul>
                    </div></div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-xl-8">
                    <div className="card border-0 h-100"><div className="card-body">
                        <h6 className="fw-bold mb-3">By zone</h6>
                        <BarChart labels={stats.by_zone.map((z) => z.zone)} datasets={[{ label: 'Impressions', data: stats.by_zone.map((z) => z.impressions) }, { label: 'Clicks', data: stats.by_zone.map((z) => z.clicks), color: '#fab005' }]} />
                        <table className="table table-sm mt-3 mb-0"><thead><tr><th>Zone</th><th className="text-end">Impr.</th><th className="text-end">Clicks</th><th className="text-end">CTR</th></tr></thead>
                            <tbody>{stats.by_zone.map((z) => <tr key={z.zone}><td>{z.zone}</td><td className="text-end">{z.impressions}</td><td className="text-end">{z.clicks}</td><td className="text-end">{z.ctr}%</td></tr>)}</tbody>
                        </table>
                    </div></div>
                </div>
                <div className="col-xl-4">
                    <div className="card border-0 h-100"><div className="card-body">
                        <h6 className="fw-bold mb-3">Devices</h6>
                        <DoughnutChart labels={Object.keys(stats.by_device).map(titleCase)} data={Object.values(stats.by_device)} />
                    </div></div>
                </div>
            </div>
        </>
    );
}
