import { useNavigate } from 'react-router-dom';
import ResultSkeleton from '../components/cards/ResultSkeleton';
import FlightResult from '../components/cards/FlightResult';
import ListingShell, { CheckList, FilterGroup, PriceInput } from '../components/search/ListingShell';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useQueryState from '../hooks/useQueryState';

export default function Flights() {
    const navigate = useNavigate();
    const [q, setQ, apiParams] = useQueryState({ airlines: [], stops: [], sort: 'price_asc', passengers: '1' });
    useDocumentTitle(q.to ? `Flights to ${q.to}` : 'Flights');
    const { data, loading, error, reload } = useApi('/flights', apiParams);

    const select = (flight) => {
        const qs = new URLSearchParams({ service_type: 'flight', item_id: flight.id, quantity: q.passengers || 1 });
        navigate(`/checkout?${qs}`);
    };

    return (
        <ListingShell
            tab="flights"
            title={q.from && q.to ? `${q.from} → ${q.to}` : 'Search cheap flights'}
            query={q}
            items={data?.data}
            meta={data}
            loading={loading}
            error={error}
            onRetry={reload}
            onPage={(page) => setQ({ page }, { resetPage: false })}
            sort={q.sort}
            onSort={(sort) => setQ({ sort })}
            sortOptions={[['price_asc', 'Cheapest first'], ['price_desc', 'Most expensive'], ['departure', 'Earliest departure'], ['duration', 'Shortest duration']]}
            skeleton={<ResultSkeleton />}
            emptyText="No flights on this date. Try a different day or remove the destination to see all departures."
            renderItem={(f) => <FlightResult flight={f} passengers={Number(q.passengers || 1)} onSelect={select} />}
            filters={(
                <>
                    <FilterGroup title="Stops">
                        <CheckList options={[['0', 'Non-stop'], ['1', '1 stop']]} value={q.stops} onChange={(stops) => setQ({ stops })} />
                    </FilterGroup>
                    <FilterGroup title="Max price"><PriceInput value={q.max_price} onChange={(max_price) => setQ({ max_price })} /></FilterGroup>
                    <FilterGroup title="Fare type">
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" id="refundable" checked={q.refundable === '1'} onChange={(e) => setQ({ refundable: e.target.checked ? '1' : '' })} />
                            <label className="form-check-label small" htmlFor="refundable">Refundable only</label>
                        </div>
                    </FilterGroup>
                    {data?.airlines?.length > 0 && (
                        <FilterGroup title="Airlines">
                            <CheckList options={data.airlines.map((a) => [a, a])} value={q.airlines} onChange={(airlines) => setQ({ airlines })} />
                        </FilterGroup>
                    )}
                </>
            )}
        />
    );
}
