import { Fragment, useState } from 'react';
import AdSlot from '../ads/AdSlot';
import { EmptyState, ErrorState } from '../common/Feedback';
import Pagination from '../common/Pagination';
import SearchWidget from './SearchWidget';

/**
 * Common chrome for every search-results page:
 * compact search bar, sort dropdown, filter sidebar (collapsible on mobile),
 * results with in-feed ads every `adEvery` items, and pagination.
 */
export default function ListingShell({
    tab, title, query, filters, items, renderItem, loading, error, onRetry, meta, onPage,
    sort, sortOptions = [], onSort, grid = false, adEvery = 4, skeleton, emptyText,
}) {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <>
            <section className="hero hero-sm bg-gradient-brand" style={{ backgroundImage: 'none' }}>
                <div className="container">
                    <h1 className="h2 fw-800 mb-3">{title}</h1>
                    <SearchWidget tab={tab} initial={query} compact tabs={false} key={JSON.stringify(query)} />
                </div>
            </section>

            <div className="container py-4">
                <AdSlot zone="search_top" className="mb-4" />
                <div className="row g-4">
                    <aside className="col-lg-3">
                        <button className="btn btn-outline-primary w-100 d-lg-none mb-2" onClick={() => setShowFilters(!showFilters)}>
                            <i className="mdi mdi-filter-variant" /> {showFilters ? 'Hide' : 'Show'} filters
                        </button>
                        <div className={`filter-panel ${showFilters ? '' : 'd-none d-lg-block'}`}>
                            <div className="card border-0 p-3 mb-3">{filters}</div>
                            <AdSlot zone="search_sidebar" className="d-none d-lg-block" />
                        </div>
                    </aside>

                    <div className="col-lg-9">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                            <div className="fw-semibold">{loading ? 'Searching…' : `${meta?.total ?? 0} result${meta?.total === 1 ? '' : 's'} found`}</div>
                            {sortOptions.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <label className="small text-soft text-nowrap" htmlFor="sort">Sort by</label>
                                    <select id="sort" className="form-select form-select-sm" value={sort} onChange={(e) => onSort(e.target.value)}>
                                        {sortOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {error && <ErrorState message={error} onRetry={onRetry} />}
                        {loading && skeleton}
                        {!loading && !error && items?.length === 0 && (
                            <div className="card border-0"><EmptyState title="No results match your search" text={emptyText || 'Try different dates, a nearby destination or fewer filters.'} /></div>
                        )}

                        {!loading && items?.length > 0 && (
                            <div className={grid ? 'row g-4' : ''}>
                                {items.map((item, i) => (
                                    <Fragment key={item.id}>
                                        {renderItem(item)}
                                        {i === adEvery - 1 && (
                                            <div className={grid ? 'col-12' : 'mb-3'}><AdSlot zone="search_inline" /></div>
                                        )}
                                    </Fragment>
                                ))}
                            </div>
                        )}
                        <Pagination meta={meta} onPage={onPage} className="mt-4" />
                    </div>
                </div>
            </div>
        </>
    );
}

/** Small helpers used by the filter sidebars. */
export function FilterGroup({ title, children }) {
    return (
        <div className="mb-4">
            <h6 className="fw-bold small text-uppercase text-soft mb-2">{title}</h6>
            {children}
        </div>
    );
}

export function CheckList({ options, value = [], onChange }) {
    const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    return options.map(([v, label]) => (
        <div className="form-check" key={v}>
            <input className="form-check-input" type="checkbox" id={`f-${v}`} checked={value.includes(String(v))} onChange={() => toggle(String(v))} />
            <label className="form-check-label small" htmlFor={`f-${v}`}>{label}</label>
        </div>
    ));
}

export function PriceInput({ value, onChange, placeholder = 'Max price' }) {
    const [local, setLocal] = useState(value ?? '');
    return (
        <form className="input-group input-group-sm" onSubmit={(e) => { e.preventDefault(); onChange(local); }}>
            <input type="number" min="0" className="form-control" placeholder={placeholder} value={local} onChange={(e) => setLocal(e.target.value)} />
            <button className="btn btn-outline-primary">Apply</button>
        </form>
    );
}
