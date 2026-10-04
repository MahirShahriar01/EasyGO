import BusResult from '../components/cards/BusResult';
import ResultSkeleton from '../components/cards/ResultSkeleton';
import ListingShell, { CheckList, FilterGroup, PriceInput } from '../components/search/ListingShell';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useQueryState from '../hooks/useQueryState';

export default function Buses() {
    const [q, setQ, apiParams] = useQueryState({ bus_type: [], operators: [], sort: 'departure' });
    useDocumentTitle(q.to ? `Buses to ${q.to}` : 'Bus tickets');
    const { data, loading, error, reload } = useApi('/buses', apiParams);

    return (
        <ListingShell
            tab="buses"
            title={q.from && q.to ? `${q.from} → ${q.to}` : 'Book bus tickets'}
            query={q}
            items={data?.data}
            meta={data}
            loading={loading}
            error={error}
            onRetry={reload}
            onPage={(page) => setQ({ page }, { resetPage: false })}
            sort={q.sort}
            onSort={(sort) => setQ({ sort })}
            sortOptions={[['departure', 'Earliest departure'], ['price_asc', 'Cheapest first'], ['price_desc', 'Most expensive']]}
            skeleton={<ResultSkeleton />}
            renderItem={(b) => <BusResult bus={b} />}
            filters={(
                <>
                    <FilterGroup title="Coach type">
                        <CheckList options={[['AC', 'AC'], ['Non-AC', 'Non-AC'], ['Sleeper', 'Sleeper'], ['Business', 'Business class']]} value={q.bus_type} onChange={(bus_type) => setQ({ bus_type })} />
                    </FilterGroup>
                    <FilterGroup title="Max fare"><PriceInput value={q.max_price} onChange={(max_price) => setQ({ max_price })} /></FilterGroup>
                    {data?.operators?.length > 0 && (
                        <FilterGroup title="Operators">
                            <CheckList options={data.operators.map((o) => [o, o])} value={q.operators} onChange={(operators) => setQ({ operators })} />
                        </FilterGroup>
                    )}
                </>
            )}
        />
    );
}
