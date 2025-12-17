'use client';

import { useState, useEffect } from 'react';
import DistributionBar from '../../components/DistributionBar';
import CompetitorTable from '../../components/CompetitorTable';
import FilterMultiSelect from '../../components/FilterMultiSelect';

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({ products: [], summary: {}, pagination: {} });
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Filter State
    const [filters, setFilters] = useState<any>({
        search: '',
        status: [],
        confidence: [],
        category: [],
        segment: [],
        collection: [],
        product_type: [],
        competitor: [],
        sortBy: 'default',
        order: 'desc'
    });

    const [page, setPage] = useState(1);

    // Filter Options
    const [filterOptions, setFilterOptions] = useState({
        categories: [], segments: [], collections: [], product_types: [], vendors: []
    });

    useEffect(() => {
        fetch(process.env.NEXT_PUBLIC_API_URL + '/analytics/filters')
            .then(res => res.json())
            .then(setFilterOptions)
            .catch(console.error);
    }, []);

    useEffect(() => {
        setLoading(true);
        const query = new URLSearchParams();

        Object.keys(filters).forEach(key => {
            if (key === 'search') {
                if (filters.search) query.append('search', filters.search);
            } else if (key !== 'sortBy' && key !== 'order') {
                filters[key].forEach((v: string) => query.append(key, v));
            }
        });

        query.append('sortBy', filters.sortBy);
        query.append('order', filters.order);

        query.append('page', page.toString());
        query.append('limit', '20');

        fetch(process.env.NEXT_PUBLIC_API_URL + '/analytics/products?' + query.toString())
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(receivedData => {
                setData(receivedData);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
                setData({ products: [], summary: {}, pagination: {} });
            });
    }, [filters, page]);

    const toggleFilter = (field: string, value: string) => {
        setFilters((prev: any) => {
            const current = prev[field];
            const updated = current.includes(value)
                ? current.filter((i: string) => i !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
        setPage(1);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters((p: any) => ({ ...p, search: e.target.value }));
        setPage(1);
    };

    const removeFilter = (field: string, value: string) => {
        setFilters((prev: any) => ({
            ...prev,
            [field]: prev[field].filter((i: string) => i !== value)
        }));
    };

    const toggleExpand = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'IMMEDIATE_ACTION': return <span className="badge badge-danger">Immediate Action</span>;
            case 'ATTENTION_NEEDED': return <span className="badge badge-warning">Attention Needed</span>;
            case 'NO_ACTION': return <span className="badge badge-success">No Action</span>;
            default: return <span className="badge badge-success">{status}</span>;
        }
    };

    // Helper to format filter values
    const formatFilterValue = (field: string, val: string) => {
        if (field === 'status') return val.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        if (field === 'confidence') return val.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        return val;
    };

    const sortAlpha = (arr: string[]) => {
        if (!arr) return [];
        return [...arr].sort((a, b) => a.localeCompare(b));
    };

    const handleSort = (col: string) => {
        setFilters((prev: any) => ({
            ...prev,
            sortBy: col,
            order: prev.sortBy === col && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>

            {/* 1. Top Summary Bar */}
            {data.summary && (
                <div className="summary-grid" style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Products Found</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{data.summary.total_products || 0}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>100% of {data.summary.total_products} products</div>
                    </div>
                    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #fee2e2', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '500' }}>Immediate Action</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>{data.summary.immediate_action_count || 0}</div>
                        <div style={{ fontSize: '0.8rem', color: '#f87171' }}>{data.summary.immediate_action_pct || 0}% of {data.summary.total_products} products</div>
                        <button className="btn btn-danger" style={{ width: '100%', fontSize: '0.85rem', marginTop: 'auto', padding: '0.4rem' }}>Add all to Action Plan</button>
                    </div>
                    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #fef3c7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ color: '#d97706', fontSize: '0.9rem', fontWeight: '500' }}>Attention Needed</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#d97706' }}>{data.summary.attention_needed_count || 0}</div>
                        <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>{data.summary.attention_needed_pct || 0}% of {data.summary.total_products} products</div>
                        <button className="btn" style={{ width: '100%', fontSize: '0.85rem', background: '#f59e0b', color: '#fff', border: 'none', marginTop: 'auto', padding: '0.4rem' }}>Add all to Action Plan</button>
                    </div>
                </div>
            )}

            {/* 2. Filter Toolbar */}
            <div style={{
                background: '#fff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem',
                display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center'
            }}>
                <input
                    type="text"
                    placeholder="Search product name or id..."
                    style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '250px', fontSize: '0.9rem' }}
                    value={filters.search}
                    onChange={handleSearch}
                />

                <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }} />

                {/* Global Filters: Status (Fixed Order but nicer labels) */}
                <FilterMultiSelect
                    label="Status"
                    options={[
                        { label: 'Immediate Action', value: 'IMMEDIATE_ACTION' },
                        { label: 'Attention Needed', value: 'ATTENTION_NEEDED' },
                        { label: 'No Action', value: 'NO_ACTION' }
                    ]}
                    selected={filters.status}
                    onChange={(val) => toggleFilter('status', val)}
                />
                {/* Global Filters: Confidence (Fixed Order but nicer labels) */}
                <FilterMultiSelect
                    label="Confidence"
                    options={[
                        { label: 'High', value: 'HIGH' },
                        { label: 'Medium', value: 'MEDIUM' },
                        { label: 'Low', value: 'LOW' }
                    ]}
                    selected={filters.confidence}
                    onChange={(val) => toggleFilter('confidence', val)}
                />

                <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }} />

                {/* Dynamic Filters - Sorted Alphabetically */}
                <FilterMultiSelect label="Category" options={sortAlpha((filterOptions as any).categories)} selected={filters.category} onChange={(val) => toggleFilter('category', val)} />
                <FilterMultiSelect label="Segment" options={sortAlpha((filterOptions as any).segments)} selected={filters.segment} onChange={(val) => toggleFilter('segment', val)} />
                <FilterMultiSelect label="Collection" options={sortAlpha((filterOptions as any).collections)} selected={filters.collection} onChange={(val) => toggleFilter('collection', val)} />
                <FilterMultiSelect label="Product Type" options={sortAlpha((filterOptions as any).product_types)} selected={filters.product_type} onChange={(val) => toggleFilter('product_type', val)} />
                <FilterMultiSelect label="Competitor" options={sortAlpha((filterOptions as any).vendors)} selected={filters.competitor} onChange={(val) => toggleFilter('competitor', val)} />
            </div>

            {/* 3. Active Filters (Chips) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {Object.keys(filters).map(key => {
                    if (key === 'search' || key === 'sortBy' || key === 'order') return null;
                    if (!Array.isArray(filters[key])) return null;
                    return filters[key].map((val: string) => (
                        <div key={`${key}-${val}`} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '20px',
                            padding: '0.25rem 0.75rem', fontSize: '0.85rem', color: '#334155'
                        }}>
                            <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{key === 'product_type' ? 'Type' : key}:</span>
                            <span>{formatFilterValue(key, val)}</span>
                            <button
                                onClick={() => removeFilter(key, val)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, marginLeft: '4px', fontSize: '1rem', lineHeight: 1 }}
                            >
                                &times;
                            </button>
                        </div>
                    ));
                })}
                {Object.values(filters).some((ary: any) => Array.isArray(ary) && ary.length > 0) && (
                    <button
                        onClick={() => setFilters({
                            search: filters.search,
                            status: [], confidence: [], category: [], segment: [], collection: [], product_type: [], competitor: [],
                            sortBy: filters.sortBy,
                            order: filters.order
                        })}
                        style={{ background: 'none', border: 'none', textDecoration: 'underline', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* 4. Main Content: Table */}
            <div>
                {loading ? <div>Loading products...</div> : (
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', overflowY: 'auto', overflowX: 'auto', maxHeight: '70vh' }}>
                        {/* Header - Sticky */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(250px, 2fr) 100px 100px 120px 150px 100px 120px', /* Adjusted gaps: 100px & 120px for last two */
                            background: '#f1f5f9',
                            padding: '0.75rem 1rem',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            color: '#475569',
                            borderBottom: '1px solid #e2e8f0',
                            minWidth: '940px', /* increased min width due to larger cols */
                            position: 'sticky',
                            top: 0,
                            zIndex: 10,
                            boxShadow: '0 2px 4px -1px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ cursor: 'pointer' }} onClick={() => handleSort('title')}>
                                Product Details {filters.sortBy === 'title' && (filters.order === 'asc' ? '▲' : '▼')}
                            </div>
                            <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('display_price')}>
                                Prices (RM) {filters.sortBy === 'display_price' && (filters.order === 'asc' ? '▲' : '▼')}
                            </div>
                            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                                Status {filters.sortBy === 'status' && (filters.order === 'asc' ? '▲' : '▼')}
                            </div>
                            <div style={{ textAlign: 'center' }}>Distribution</div>
                            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('worse_index')}>
                                Worst Index {filters.sortBy === 'worse_index' && (filters.order === 'asc' ? '▲' : '▼')}
                            </div>
                            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('competitor_count')}>
                                Total Comp. {filters.sortBy === 'competitor_count' && (filters.order === 'asc' ? '▲' : '▼')}
                            </div>
                            <div style={{ cursor: 'pointer' }} onClick={() => handleSort('cheapest_competitor')}>
                                Cheapest Comp. {filters.sortBy === 'cheapest_competitor' && (filters.order === 'asc' ? '▲' : '▼')}
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ minWidth: '940px' }}>
                            {data.products.map((p: any) => {
                                const isExpanded = expandedRows.has(p.product_id);

                                let worseIndexColor = '#475569';
                                if (p.worse_index_status === 'RED') worseIndexColor = 'var(--danger)';
                                else if (p.worse_index_status === 'ORANGE') worseIndexColor = 'var(--warning)';

                                const handleProductClick = (e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    if (p.product_link) window.open(p.product_link, '_blank');
                                };

                                return (
                                    <div key={p.product_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        {/* Row */}
                                        <div
                                            onClick={() => toggleExpand(p.product_id)}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'minmax(250px, 2fr) 100px 100px 120px 150px 100px 120px', /* Matching header */
                                                padding: '0.75rem 1rem',
                                                alignItems: 'center',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                background: isExpanded ? '#f8fafc' : '#fff',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div onClick={handleProductClick} style={{ cursor: p.product_link ? 'pointer' : 'default', flexShrink: 0 }}>
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                                    ) : <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '4px' }} />}
                                                </div>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div
                                                        onClick={handleProductClick}
                                                        style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: p.product_link ? 'pointer' : 'default', color: p.product_link ? '#0f172a' : 'inherit' }}
                                                    >
                                                        {p.title}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {p.product_id}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                                                <div title="Display Price" style={{ fontWeight: '500' }}>{p.display_price?.toFixed(2)}</div>
                                                <div title="Standardized Price" style={{ color: '#64748b', fontSize: '0.75rem' }}>Std: {p.normalized_price?.toFixed(2)}</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>{getStatusBadge(p.status)}</div>
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <DistributionBar red={p.stats.red} orange={p.stats.orange} green={p.stats.green} />
                                            </div>
                                            <div style={{ textAlign: 'center', fontWeight: 'bold', color: worseIndexColor }}>
                                                {p.worse_index.toFixed(2)}
                                            </div>
                                            <div style={{ textAlign: 'center', color: '#64748b' }}>{p.competitor_count}</div>
                                            <div style={{ color: p.cheapest_competitor ? '#0f172a' : '#94a3b8', fontSize: '0.85rem' }}>
                                                {p.cheapest_competitor || '-'}
                                            </div>
                                        </div>

                                        {/* Expanded View */}
                                        {isExpanded && (
                                            <div style={{ background: '#f8fafc', padding: '1rem 1rem 1rem 4rem', borderTop: '1px solid #f1f5f9' }}>
                                                <CompetitorTable
                                                    listings={p.listings}
                                                    worseIndex={p.worse_index}
                                                    worseIndexStatus={p.worse_index_status}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '0.5rem' }}>
                    <button
                        className="btn"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1' }}
                    >
                        Previous
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                        Page {data.pagination?.current || 1} of {data.pagination?.pages || 1}
                    </span>
                    <button
                        className="btn"
                        disabled={page >= (data.pagination?.pages || 1)}
                        onClick={() => setPage(p => p + 1)}
                        style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1' }}
                    >
                        Next
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @media (max-width: 1024px) {
                    .summary-grid {
                        grid-template-columns: 1fr;
                    }
                }
                @media (min-width: 1024px) {
                    .summary-grid {
                        grid-template-columns: 1fr 1fr 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
