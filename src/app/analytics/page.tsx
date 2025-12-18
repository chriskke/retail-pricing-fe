
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionContext } from '../../context/ActionContext';
import DistributionBar from '../../components/DistributionBar';
import CompetitorTable from '../../components/CompetitorTable';
import FilterMultiSelect from '../../components/FilterMultiSelect';
import CompetitorOverviewTable from '../../components/CompetitorOverviewTable';
import ToastNotification from '../../components/ToastNotification';

export default function AnalyticsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Access Context
    const { selectedItems, toggleItem, toggleSelectAllPage, isAllSelected, setSelectAllGlobal, clearSelection, selectionCount, actionBoardItems, addToActionBoard, refreshActionBoard } = useActionContext();

    const [activeTab, setActiveTab] = useState<'products' | 'competitors'>('products');
    const [loading, setLoading] = useState(true);

    // Toast
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // Data States
    const [productData, setProductData] = useState<any>({ products: [], summary: {}, pagination: {} });
    const [competitorData, setCompetitorData] = useState<any>({ competitors: [], summary: {} });

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
        sortBy: 'default', // default for products
        order: 'desc'
    });

    // Reset sort when switching tabs if needed, or keep separate sort states
    // For simplicity, we reuse the same filter state, but we might want to reset sortBy on tab switch
    // to avoid sending 'worse_index' sort to competitor endpoint which expects 'cheapest_anchor'

    const [page, setPage] = useState(1);
    const [competitorPage, setCompetitorPage] = useState(1);
    const COMPETITORS_PER_PAGE = 20;

    // Persist State
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const queryCompetitor = searchParams.get('competitor');
        const savedFilters = sessionStorage.getItem('analytics_filters');
        const savedTab = sessionStorage.getItem('analytics_tab');
        const queryTab = searchParams.get('tab');

        if (queryCompetitor) {
            // Drill-down from Competitor View: valid competitor param resets usage
            setActiveTab('products');
            setFilters({
                search: '',
                status: [],
                confidence: [],
                category: [],
                segment: [],
                collection: [],
                product_type: [],
                competitor: [decodeURIComponent(queryCompetitor)],
                sortBy: 'default',
                order: 'desc'
            });
        } else {
            if (savedFilters) {
                try {
                    setFilters(JSON.parse(savedFilters));
                } catch (e) {
                    console.error("Failed to parse filters", e);
                }
            }

            // Priority: Query Param > Saved Session > Default 'products'
            if (queryTab === 'products' || queryTab === 'competitors') {
                setActiveTab(queryTab);
            } else if (savedTab && (savedTab === 'products' || savedTab === 'competitors')) {
                setActiveTab(savedTab as 'products' | 'competitors');
            }
        }
        setIsInitialized(true);
    }, [searchParams]);

    useEffect(() => {
        if (!isInitialized) return;
        sessionStorage.setItem('analytics_filters', JSON.stringify(filters));
        sessionStorage.setItem('analytics_tab', activeTab);
    }, [filters, activeTab, isInitialized]);



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

    // Handler for Tab Switch
    const handleTabChange = (tab: 'products' | 'competitors') => {
        setActiveTab(tab);
        setPage(1);
        setCompetitorPage(1);
        // Reset specific sorts when switching
        if (tab === 'competitors') {
            setFilters((prev: any) => ({ ...prev, sortBy: 'cheapest_anchor', order: 'desc' }));
        } else {
            setFilters((prev: any) => ({ ...prev, sortBy: 'default', order: 'desc' }));
        }
    };

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

        if (activeTab === 'products') {
            query.append('page', page.toString());
            query.append('limit', '20');

            query.append('limit', '20');

            // Backend now handles auto-exclusion of board items, so we don't need to pass them in URL.
            // This prevents URL length issues with large exclusion lists.

            fetch(process.env.NEXT_PUBLIC_API_URL + '/analytics/products?' + query.toString())
                .then(res => {
                    if (!res.ok) throw new Error('Failed');
                    return res.json();
                })
                .then(receivedData => {
                    setProductData(receivedData);
                    setLoading(false);
                })
                .catch(e => {
                    console.error(e);
                    setLoading(false);
                });
        } else {
            // Competitor Tab
            fetch(process.env.NEXT_PUBLIC_API_URL + '/analytics/competitors?' + query.toString())
                .then(res => {
                    if (!res.ok) throw new Error('Failed');
                    return res.json();
                })
                .then(receivedData => {
                    setCompetitorData(receivedData);
                    setLoading(false);
                })
                .catch(e => {
                    console.error(e);
                    setLoading(false);
                });
        }
    }, [filters, page, activeTab, actionBoardItems]); // Re-fetch when actionBoardItems change (to exclude them)

    const toggleFilter = (field: string, value: string) => {
        setFilters((prev: any) => {
            const current = prev[field];
            const updated = current.includes(value)
                ? current.filter((i: string) => i !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
        setPage(1);
        setCompetitorPage(1);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters((p: any) => ({ ...p, search: e.target.value }));
        setPage(1);
        setCompetitorPage(1);
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

    const toggleSort = (col: string) => {
        setFilters((prev: any) => ({
            ...prev,
            sortBy: col,
            order: prev.sortBy === col && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Pagination Logic for Competitors
    const sortedCompetitors = competitorData.competitors || [];
    const totalCompetitors = sortedCompetitors.length;
    const paginatedCompetitors = sortedCompetitors.slice(
        (competitorPage - 1) * COMPETITORS_PER_PAGE,
        competitorPage * COMPETITORS_PER_PAGE
    );
    const totalCompetitorPages = Math.ceil(totalCompetitors / COMPETITORS_PER_PAGE);

    // Bulk Selection Helpers
    const allOnPageSelected = productData.products.length > 0 && productData.products.every((p: any) => selectedItems.has(p.product_id));

    const handleSelectAllGlobal = () => {
        setSelectAllGlobal(true, filters);
    };

    // Bulk Add Logic
    const handleBulkAdd = async (status: string) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions/bulk-add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...filters, status: [status] }) // Apply current filters + specific status
            });
            refreshActionBoard();
            setToast({ msg: `Added all '${status.replace('_', ' ').toLowerCase()}' products to Action Board`, type: 'success' });
        } catch (e) {
            console.error("Bulk add failed", e);
            setToast({ msg: "Failed to add items", type: 'error' });
        }
    };

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            {toast && <ToastNotification message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f172a' }}>Analytics</h1>
                <p style={{ color: '#64748b' }}>Analyze market trends and competitor pricing.</p>
            </div>


            {/* 1. Top Summary Bar (Dynamic based on Tab) */}
            {activeTab === 'products' ? (
                <div className="summary-grid" style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Products Found</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{productData.summary.total_products || 0}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{productData.summary.total_pct || 0}% of {productData.summary.total_db_count || 0} products</div>
                    </div>
                    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #fee2e2', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '500' }}>Immediate Action</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>{productData.summary.immediate_action_count || 0}</div>
                        <div style={{ fontSize: '0.8rem', color: '#f87171' }}>{productData.summary.immediate_action_pct || 0}% of {productData.summary.total_db_count || 0} products</div>
                        <button
                            className="btn"
                            onClick={() => handleBulkAdd('IMMEDIATE_ACTION')}
                            style={{ width: '100%', fontSize: '0.85rem', marginTop: 'auto', padding: '0.4rem', background: '#ef4444', color: '#fff', border: 'none' }}
                        >
                            Add all to Action Plan
                        </button>
                    </div>
                    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #fef3c7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ color: '#d97706', fontSize: '0.9rem', fontWeight: '500' }}>Attention Needed</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#d97706' }}>{productData.summary.attention_needed_count || 0}</div>
                        <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>{productData.summary.attention_needed_pct || 0}% of {productData.summary.total_db_count || 0} products</div>
                        <button
                            className="btn"
                            onClick={() => handleBulkAdd('ATTENTION_NEEDED')}
                            style={{ width: '100%', fontSize: '0.85rem', background: '#f59e0b', color: '#fff', border: 'none', marginTop: 'auto', padding: '0.4rem' }}
                        >
                            Add all to Action Plan
                        </button>
                    </div>
                </div>
            ) : (
                <div className="summary-grid" style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
                    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Competitors Found</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{competitorData.summary.total_competitors || 0}</div>
                    </div>
                    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Cheapest Competitor</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{competitorData.summary.cheapest_competitor?.name || '-'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cheapest for {competitorData.summary.cheapest_competitor?.count || 0} products</div>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
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

            {/* 4. Tab Switcher */}
            <div style={{ display: 'flex', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    onClick={() => handleTabChange('products')}
                    style={{
                        padding: '0.75rem 1.5rem', background: 'none', border: 'none', fontSize: '0.9rem', fontWeight: 500,
                        borderBottom: activeTab === 'products' ? '2px solid #0f172a' : 'none',
                        color: activeTab === 'products' ? '#0f172a' : '#64748b', cursor: 'pointer'
                    }}
                >
                    Product View
                </button>
                <button
                    onClick={() => handleTabChange('competitors')}
                    style={{
                        padding: '0.75rem 1.5rem', background: 'none', border: 'none', fontSize: '0.9rem', fontWeight: 500,
                        borderBottom: activeTab === 'competitors' ? '2px solid #0f172a' : 'none',
                        color: activeTab === 'competitors' ? '#0f172a' : '#64748b', cursor: 'pointer'
                    }}
                >
                    Competitor View
                </button>
            </div>

            {/* 5. Main Content: Table */}
            <div>
                {activeTab === 'products' ? (
                    <>
                        <div style={{ position: 'relative' }}>
                            {loading && (
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', zIndex: 20,
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(1px)', borderRadius: '8px'
                                }}>
                                    <div style={{ background: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontWeight: '500', color: '#0f172a' }}>
                                        Updating...
                                    </div>
                                </div>
                            )}
                            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', overflowY: 'auto', overflowX: 'auto', maxHeight: '80vh' }}>
                                {/* Header - Sticky */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '50px minmax(250px, 2fr) 100px 100px 100px 120px 150px 120px',
                                    background: '#f1f5f9',
                                    padding: '0.75rem 1rem',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    color: '#475569',
                                    borderBottom: '1px solid #e2e8f0',
                                    minWidth: '940px',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 10,
                                    boxShadow: '0 2px 4px -1px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected || allOnPageSelected}
                                            onChange={() => !isAllSelected && toggleSelectAllPage(productData.products.map((p: any) => p.product_id))}
                                            style={{ cursor: 'pointer', transform: 'scale(0.85)', margin: 0 }}
                                        />
                                    </div>
                                    <div style={{ cursor: 'pointer' }} onClick={() => toggleSort('title')}>
                                        Product Name {filters.sortBy === 'title' && (filters.order === 'asc' ? '▲' : '▼')}
                                    </div>
                                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleSort('display_price')}>
                                        Ours (RM) {filters.sortBy === 'display_price' && (filters.order === 'asc' ? '▲' : '▼')}
                                    </div>
                                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleSort('cheapest_price')}>
                                        Them (RM) {filters.sortBy === 'cheapest_price' && (filters.order === 'asc' ? '▲' : '▼')}
                                    </div>
                                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleSort('listings_count')}>
                                        Compared {filters.sortBy === 'listings_count' && (filters.order === 'asc' ? '▲' : '▼')}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>Distribution</div>
                                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleSort('worse_index')}>
                                        Worst Index {filters.sortBy === 'worse_index' && (filters.order === 'asc' ? '▲' : '▼')}
                                    </div>
                                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleSort('status')}>
                                        Status {filters.sortBy === 'status' && (filters.order === 'asc' ? '▲' : '▼')}
                                    </div>
                                </div>

                                {/* Body */}
                                <div style={{ minWidth: '940px' }}>
                                    {productData.products.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No products found.</div>
                                    ) : (
                                        productData.products.map((p: any) => {
                                            const isExpanded = expandedRows.has(p.product_id);

                                            let worseIndexColor = '#475569';
                                            if (p.worse_index_status === 'RED') worseIndexColor = 'var(--danger)';
                                            else if (p.worse_index_status === 'ORANGE') worseIndexColor = 'var(--warning)';

                                            // Board items are excluded, so no need to check isConfirmed
                                            const borderStyle = 'none';
                                            const rowBg = isExpanded ? '#f8fafc' : '#fff';

                                            const handleProductClick = (e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                if (p.product_link) window.open(p.product_link, '_blank');
                                            };

                                            return (
                                                <div key={p.product_id} style={{ borderBottom: '1px solid #f1f5f9', borderLeft: borderStyle, background: rowBg }}>
                                                    {/* Row */}
                                                    <div
                                                        onClick={() => toggleExpand(p.product_id)}
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '50px minmax(250px, 2fr) 100px 100px 100px 120px 150px 120px',
                                                            padding: '0.75rem 1rem',
                                                            alignItems: 'center',
                                                            fontSize: '0.9rem',
                                                            cursor: 'pointer',
                                                            background: isExpanded ? '#f8fafc' : '#fff',
                                                            transition: 'background 0.2s'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isAllSelected || selectedItems.has(p.product_id)}
                                                                onChange={(e) => { toggleItem(p.product_id); }}
                                                                disabled={isAllSelected} // items on board are hidden, so we don't need isConfirmed check
                                                                style={{ cursor: 'pointer', transform: 'scale(0.85)', margin: 0 }}
                                                            />
                                                        </div>
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
                                                        <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                                            <div title="Display Price" style={{ fontWeight: '500' }}>{p.display_price?.toFixed(2)}</div>
                                                            <div title="Standardized Price" style={{ color: '#64748b', fontSize: '0.75rem' }}>Std: {p.normalized_price?.toFixed(2)}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                                            <div title="Cheapest Display Price" style={{ fontWeight: '500', color: p.cheapest_match_price ? '#0f172a' : '#94a3b8' }}>
                                                                {p.cheapest_match_display_price !== null && p.cheapest_match_display_price !== undefined ? p.cheapest_match_display_price.toFixed(2) : '-'}
                                                            </div>
                                                            <div title="Cheapest Std Price" style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                                Std: {p.cheapest_match_price !== null && p.cheapest_match_price !== undefined ? p.cheapest_match_price.toFixed(2) : '-'}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'center', color: '#64748b' }}>{p.listings_count}</div>
                                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                            <DistributionBar red={p.stats.red} orange={p.stats.orange} green={p.stats.green} />
                                                        </div>
                                                        <div style={{ textAlign: 'center', fontWeight: 'bold', color: worseIndexColor }}>
                                                            {p.worse_index.toFixed(2)}
                                                        </div>
                                                        <div style={{ textAlign: 'center' }}>{getStatusBadge(p.status)}</div>
                                                    </div>

                                                    {/* Expanded View */}
                                                    {isExpanded && (
                                                        <div style={{ background: '#f8fafc', padding: '1rem 1rem 1rem 7rem', borderTop: '1px solid #f1f5f9' }}>
                                                            <CompetitorTable
                                                                listings={p.listings}
                                                                worseIndex={p.worse_index}
                                                                worseIndexStatus={p.worse_index_status}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

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
                                Page {productData.pagination?.current || 1} of {productData.pagination?.pages || 1}
                            </span>
                            <button
                                className="btn"
                                disabled={page >= (productData.pagination?.pages || 1)}
                                onClick={() => setPage(p => p + 1)}
                                style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1' }}
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    // Competitor Tab
                    <>
                        <CompetitorOverviewTable
                            data={paginatedCompetitors}
                            loading={loading}
                            sort={{ col: filters.sortBy, order: filters.order }}
                            handleSort={toggleSort}
                        />

                        {/* Competitor Pagination */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '0.5rem' }}>
                            <button
                                className="btn"
                                disabled={competitorPage === 1}
                                onClick={() => setCompetitorPage(p => Math.max(1, p - 1))}
                                style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1' }}
                            >
                                Previous
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                                Page {competitorPage} of {totalCompetitorPages || 1}
                            </span>
                            <button
                                className="btn"
                                disabled={competitorPage >= totalCompetitorPages}
                                onClick={() => setCompetitorPage(p => p + 1)}
                                style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1' }}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Banner for Global Selection */}
            {activeTab === 'products' && (isAllSelected || (allOnPageSelected && productData.summary.total_products > productData.products.length)) && (
                <div style={{
                    position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
                    background: '#e0f2fe', border: '1px solid #bae6fd', padding: '0.75rem 1.5rem', borderRadius: '8px',
                    display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50
                }}>
                    <div style={{ color: '#0369a1', fontSize: '0.9rem' }}>
                        {isAllSelected
                            ? `All ${productData.summary.total_products} products selected.`
                            : `All ${productData.products.length} products on this page are selected.`}
                    </div>
                    {!isAllSelected && (
                        <button
                            onClick={handleSelectAllGlobal}
                            style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Select all {productData.summary.total_products} products matching filters
                        </button>
                    )}
                    {isAllSelected && (
                        <button
                            onClick={clearSelection}
                            style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Clear selection
                        </button>
                    )}
                </div>
            )}

            {/* Toast */}
            {toast && <ToastNotification message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Bulk Actions Bar */}
            {(selectedItems.size > 0 || isAllSelected) && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: '#fff', borderTop: '1px solid #e2e8f0', padding: '1rem 2rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)', zIndex: 100
                }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                            {isAllSelected ? productData.summary.total_products : selectedItems.size} items selected
                        </div>
                        <button onClick={clearSelection} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                            Clear
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => {
                                const query = new URLSearchParams();
                                if (isAllSelected) {
                                    query.append('global_select', 'true');
                                    Object.keys(filters).forEach(key => {
                                        if (key === 'search') {
                                            if (filters.search) query.append('search', filters.search);
                                        } else if (key !== 'sortBy' && key !== 'order' && Array.isArray(filters[key])) {
                                            filters[key].forEach((v: string) => query.append(key, v));
                                        }
                                    });
                                } else {
                                    query.append('ids', Array.from(selectedItems).join(','));
                                }

                                const url = `${process.env.NEXT_PUBLIC_API_URL}/actions/export?${query.toString()}`;
                                window.open(url, '_blank');
                            }}
                            className="btn"
                            style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#475569' }}
                        >
                            Export to Excel
                        </button>
                        <button
                            onClick={async () => {
                                // Add to action board list instead of redirecting
                                if (isAllSelected) {
                                    // Global Bulk Add Implementation needed if not using the 'status' shortcut
                                    // For now, let's assume global select via filters logic similar to bulk-add
                                    try {
                                        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions/bulk-add`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(filters)
                                        });
                                        refreshActionBoard();
                                        setToast({ msg: "All matching items added to Action Board", type: 'success' });
                                        clearSelection();
                                    } catch (e) {
                                        setToast({ msg: "Failed to add items", type: 'error' });
                                    }
                                } else {
                                    addToActionBoard(Array.from(selectedItems));
                                    setToast({ msg: `${selectedItems.size} items added to Action Board`, type: 'success' });
                                    clearSelection();
                                }
                            }}
                            className="btn"
                            style={{ background: '#0f172a', color: '#fff', border: 'none' }}
                        >
                            Add to Action Board
                        </button>
                    </div>
                </div>
            )}

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
