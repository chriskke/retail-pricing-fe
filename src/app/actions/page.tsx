'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionContext } from '../../context/ActionContext';
import CompetitorTable from '../../components/CompetitorTable';
import DistributionBar from '../../components/DistributionBar';
import ToastNotification from '../../components/ToastNotification';
import ConfirmationModal from '../../components/ConfirmationModal';
import InputModal from '../../components/InputModal';

export default function ActionBoardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { actionBoardItems, removeFromActionBoard, refreshActionBoard } = useActionContext();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [priceActions, setPriceActions] = useState<Record<string, { type: 'MATCH' | 'UNDERCUT' | 'REDUCE' | 'MANUAL', value: string, newPrice: number | null }>>({});
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Tab State
    const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

    // Stats State
    const [stats, setStats] = useState({ pending: 0, completed: 0 });

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'PENDING' || tab === 'COMPLETED') {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Pagination
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

    // Toast
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // Sorting State
    const [sort, setSort] = useState<{ col: string, order: 'asc' | 'desc' }>({ col: 'history_created_at', order: 'desc' });

    // Selection State
    const [selectedActionItems, setSelectedActionItems] = useState<Set<string>>(new Set());

    // Modals
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [showUndercutModal, setShowUndercutModal] = useState(false);
    const [showRevertConfirm, setShowRevertConfirm] = useState(false);
    const [showReduceModal, setShowReduceModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleResetActions = () => {
        if (selectedActionItems.size === 0) return;
        setPriceActions(prev => {
            const next = { ...prev };
            selectedActionItems.forEach(id => delete next[id]);
            return next;
        });
        setToast({ msg: "Actions reset for selected items", type: 'success' });
    };

    const fetchActionProducts = async () => {
        setLoading(true);
        try {
            // Fetch current tab with pagination
            const params = new URLSearchParams();
            params.append('tab_status', activeTab);
            params.append('page', page.toString());
            params.append('limit', '20');

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions/products?${params.toString()}`);
            const data = await res.json();

            setProducts(data.products || []);
            if (data.pagination) {
                setPagination({
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages,
                    limit: data.pagination.limit
                });
            }

            // Fetch Stats (Counts)
            const pendingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions/products?tab_status=PENDING&limit=1`);
            const completedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions/products?tab_status=COMPLETED&limit=1`);
            const pendingData = await pendingRes.json();
            const completedData = await completedRes.json();

            setStats({
                pending: pendingData.pagination ? pendingData.pagination.total : (pendingData.products || []).length,
                completed: completedData.pagination ? completedData.pagination.total : (completedData.products || []).length
            });
            setSelectedActionItems(new Set()); // Clear selection on fetch

        } catch (error) {
            console.error("Failed to fetch action products", error);
            setToast({ msg: "Failed to load products", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1); // Reset page on tab switch
        if (activeTab === 'COMPLETED') {
            setSort({ col: 'history_created_at', order: 'desc' });
        } else {
            setSort({ col: 'added_at', order: 'desc' });
        }
    }, [activeTab]);

    useEffect(() => {
        fetchActionProducts();
    }, [activeTab, page, actionBoardItems]);

    const toggleExpand = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSort = (col: string) => {
        setSort(prev => ({
            col,
            order: prev.col === col && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Sorting logic (Client-side for current page)
    const sortedProducts = [...products].sort((a, b) => {
        const order = sort.order === 'asc' ? 1 : -1;
        let valA = a[sort.col];
        let valB = b[sort.col];

        // Handle specific columns
        if (sort.col === 'display_price') {
            valA = a.display_price || 0;
            valB = b.display_price || 0;
        } else if (sort.col === 'cheapest_match_display_price') {
            valA = a.cheapest_match_display_price || 0;
            valB = b.cheapest_match_display_price || 0;
        } else if (sort.col === 'new_price') {
            valA = priceActions[a.product_id]?.newPrice || 0;
            valB = priceActions[b.product_id]?.newPrice || 0;
        } else if (sort.col === 'history_created_at') {
            valA = new Date(a.history_created_at || 0).getTime();
            valB = new Date(b.history_created_at || 0).getTime();
        }

        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
    });

    // Selection Logic
    const toggleSelection = (id: string) => {
        setSelectedActionItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const allOnPage = products.every(p => selectedActionItems.has(p.product_id));
        if (allOnPage) {
            // Deselect all on this page
            setSelectedActionItems(prev => {
                const next = new Set(prev);
                products.forEach(p => next.delete(p.product_id));
                return next;
            });
        } else {
            // Select all on this page
            setSelectedActionItems(prev => {
                const next = new Set(prev);
                products.forEach(p => next.add(p.product_id));
                return next;
            });
        }
    };

    const calculateNewPrice = (product: any, type: string, value: string) => {
        // RATIONALE: User wants to operate on Standard Price (normalized_price).
        // Match/Undercut targets (cheapest) should be the COMPETITOR'S STANDARD PRICE.
        // Formula: MyDisplay = MyStd * Ratio (where Ratio = MyDisplay / MyStd)

        // My Ratio
        const myStd = product.normalized_price || 0;
        const myDisplay = product.display_price || 0;
        const ratio = myStd > 0 ? myDisplay / myStd : 1;

        // Target: Competitor's Cheapest Standard Price
        const targetStd = product.cheapest_match_price;
        // If no competitor price, fallback? Or return null? 
        // Logic says "match cheapest". If no cheapest, cannot match.
        // Fallback to my own display/std if desperate logic needed, but usually return null.
        if (!targetStd && (type === 'MATCH' || type === 'UNDERCUT')) return null;

        if (type === 'MATCH') {
            // Match their Standard Price
            // NewStd = TargetStd
            return targetStd;
        }
        if (type === 'UNDERCUT') {
            // Undercut their Standard Price by X%
            const pct = parseFloat(value);
            if (isNaN(pct)) return null;
            // NewStd = TargetStd * (1 - pct)
            return targetStd * (1 - (pct / 100));
        }
        if (type === 'REDUCE') {
            // Reduce MY STANDARD PRICE by X%
            const pct = parseFloat(value);
            if (isNaN(pct)) return null;
            return myStd * (1 - (pct / 100));
        }
        if (type === 'MANUAL') {
            // Assume user enters desired DISPLAY PRICE (Manual Price)
            // They see Display Price, they edit Display Price.
            // NewStd = EnteredDisplay / Ratio
            const val = parseFloat(value);
            if (isNaN(val)) return null;
            return val / ratio;
        }
        return null;
    };

    // Helper to calculate derived Display price for UI
    const getDerivedDisplayPrice = (product: any, newStdPrice: number | null) => {
        if (newStdPrice === null) return null;
        const myStd = product.normalized_price || 0;
        const myDisplay = product.display_price || 0;
        const ratio = myStd > 0 ? myDisplay / myStd : 1;
        return newStdPrice * ratio;
    };

    const handleActionChange = (id: string, type: 'MATCH' | 'UNDERCUT' | 'REDUCE' | 'MANUAL', value: string = '') => {
        const product = products.find(p => p.product_id === id);
        if (!product) return;

        const newPrice = calculateNewPrice(product, type, value);

        setPriceActions(prev => ({
            ...prev,
            [id]: { type, value, newPrice }
        }));
    };

    const applyBulkAction = (type: 'MATCH' | 'UNDERCUT' | 'REDUCE', value: string = '') => {
        // Apply to selected items only, or all if none selected? 
        // USer said "bulk selected and perform actions", so implying selection. 
        // But previously it was all. Let's apply to SELECTED items if any, otherwise warn to select.

        if (selectedActionItems.size === 0) {
            setToast({ msg: "Please select items first", type: 'error' });
            return;
        }

        const newActions: any = { ...priceActions };
        selectedActionItems.forEach(id => {
            const p = products.find(prod => prod.product_id === id);
            if (p) {
                const newPrice = calculateNewPrice(p, type, value);
                if (newPrice !== null) {
                    newActions[id] = { type, value, newPrice };
                }
            }
        });
        setPriceActions(newActions);
    };

    const submitPriceChanges = async (idsToProcess: string[] = []) => {
        // If specific IDs passed (e.g. single row), use them. 
        // If not, and it's from the bulk button, infer from logic:
        // "This button will ONLY perform repricing on the product which actions already selected."

        // Filter priceActions to find valid payload
        let targetIds = idsToProcess;
        if (targetIds.length === 0) {
            // Bulk submit: Find all items that have a pending action
            // User Req: "This button will ONLY perform repricing on the product which actions already selected."
            targetIds = Object.keys(priceActions).filter(id => products.find(p => p.product_id === id));
        }

        if (targetIds.length === 0) {
            setToast({ msg: "No actions pending to submit", type: 'error' });
            return;
        }

        const payload = {
            actions: targetIds.map(id => ({
                product_id: id,
                ...priceActions[id]
            })).filter(a => a.type), // ensure action exists
            is_global: false
        };

        if (payload.actions.length === 0) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setToast({ msg: `Successfully processed ${data.count} updates`, type: 'success' });
                // Clear processed actions
                setPriceActions(prev => {
                    const next = { ...prev };
                    targetIds.forEach(id => delete next[id]);
                    return next;
                });
                // Clear selection
                setSelectedActionItems(prev => {
                    const next = new Set(prev);
                    targetIds.forEach(id => next.delete(id));
                    return next;
                });
                fetchActionProducts();
                refreshActionBoard();
            } else {
                setToast({ msg: "Submission failed", type: 'error' });
            }
        } catch (e) {
            console.error("Failed to submit", e);
            setToast({ msg: "Submission encountered an error", type: 'error' });
        }
    };

    const handleBulkRemove = async () => {
        // Just trigger modal
        if (selectedActionItems.size === 0) return;
        setShowRemoveConfirm(true);
    };

    const confirmRemove = async () => {
        setProcessing(true);
        try {
            await removeFromActionBoard(Array.from(selectedActionItems));
            setSelectedActionItems(new Set());
            setShowRemoveConfirm(false);
        } finally {
            setProcessing(false);
        }
    };

    const handleRevert = async () => {
        if (selectedActionItems.size === 0) return;
        // Logic for Revert: Call API
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions/revert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedActionItems) })
            });
            if (res.ok) {
                setToast({ msg: "Items reverted to Pending", type: 'success' });
                setSelectedActionItems(new Set());
                fetchActionProducts();
                refreshActionBoard();
            } else {
                setToast({ msg: "Failed to revert", type: 'error' });
            }
        } catch (e) {
            setToast({ msg: "Error Reverting", type: 'error' });
        }
        setShowRevertConfirm(false);
    };

    const handleExport = async () => {
        // Logic for Export
        const ids = Array.from(selectedActionItems).join(',');
        window.open(`${process.env.NEXT_PUBLIC_API_URL}/actions/export?ids=${ids}`, '_blank');
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {toast && <ToastNotification message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <ConfirmationModal
                isOpen={showRemoveConfirm}
                title="Confirm Removal"
                message={`Are you sure you want to remove ${selectedActionItems.size} items from the Action Board?`}
                onConfirm={confirmRemove}
                onCancel={() => setShowRemoveConfirm(false)}
                isProcessing={processing}
                confirmText="Remove"
            />

            <ConfirmationModal
                isOpen={showRevertConfirm}
                title="Confirm Revert"
                message={`Revert ${selectedActionItems.size} items to Pending?`}
                onConfirm={handleRevert}
                onCancel={() => setShowRevertConfirm(false)}
                confirmText="Revert"
            />

            <InputModal
                isOpen={showUndercutModal}
                title="Undercut Percentage"
                message="Enter the percentage to undercut (e.g., 5)"
                placeholder="%"
                onConfirm={(val: string) => {
                    applyBulkAction('UNDERCUT', val);
                    setShowUndercutModal(false);
                }}
                onCancel={() => setShowUndercutModal(false)}
            />

            <InputModal
                isOpen={showReduceModal}
                title="Reduce Price %"
                message="Enter percentage to reduce your current price by (e.g., 10)"
                placeholder="%"
                onConfirm={(val: string) => {
                    applyBulkAction('REDUCE', val);
                    setShowReduceModal(false);
                }}
                onCancel={() => setShowReduceModal(false)}
            />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f172a' }}>Action Board</h1>
                    <p style={{ color: '#64748b' }}>Manage your pricing actions.</p>
                </div>
            </div>

            {/* Top Summary Grid */}
            <div className="summary-grid" style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Pending Actions</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f172a' }}>{stats.pending}</div>
                </div>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Completed Actions</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#22c55e' }}>{stats.completed}</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    onClick={() => setActiveTab('PENDING')}
                    style={{
                        padding: '0.75rem 1.5rem', background: 'none', border: 'none', fontSize: '0.9rem', fontWeight: 500,
                        borderBottom: activeTab === 'PENDING' ? '2px solid #0f172a' : 'none',
                        color: activeTab === 'PENDING' ? '#0f172a' : '#64748b', cursor: 'pointer'
                    }}
                >
                    Pending
                </button>
                <button
                    onClick={() => setActiveTab('COMPLETED')}
                    style={{
                        padding: '0.75rem 1.5rem', background: 'none', border: 'none', fontSize: '0.9rem', fontWeight: 500,
                        borderBottom: activeTab === 'COMPLETED' ? '2px solid #0f172a' : 'none',
                        color: activeTab === 'COMPLETED' ? '#0f172a' : '#64748b', cursor: 'pointer'
                    }}
                >
                    Completed
                </button>
            </div>

            {/* Bulk Actions (Only for Pending) */}
            {activeTab === 'PENDING' ? (
                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#64748b' }}>Bulk Actions:</span>
                        <button
                            onClick={() => applyBulkAction('MATCH')}
                            disabled={selectedActionItems.size === 0}
                            style={{ opacity: selectedActionItems.size === 0 ? 0.5 : 1, fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>
                            Match Cheapest
                        </button>
                        <button
                            onClick={() => setShowUndercutModal(true)}
                            disabled={selectedActionItems.size === 0}
                            style={{ opacity: selectedActionItems.size === 0 ? 0.5 : 1, fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>
                            Undercut %
                        </button>
                        <button
                            onClick={() => setShowReduceModal(true)}
                            disabled={selectedActionItems.size === 0}
                            style={{ opacity: selectedActionItems.size === 0 ? 0.5 : 1, fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: '4px', cursor: 'pointer' }}>
                            Reduce %
                        </button>
                        <button
                            onClick={handleResetActions}
                            disabled={selectedActionItems.size === 0}
                            style={{ opacity: selectedActionItems.size === 0 ? 0.5 : 1, fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: '4px', cursor: 'pointer' }}>
                            Reset
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={handleBulkRemove}
                            disabled={selectedActionItems.size === 0}
                            style={{ opacity: selectedActionItems.size === 0 ? 0.5 : 1, fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '4px', cursor: 'pointer', marginRight: '1rem' }}>
                            Remove
                        </button>
                        <button
                            onClick={() => submitPriceChanges()}
                            disabled={Object.keys(priceActions).length === 0}
                            className={Object.keys(priceActions).length > 0 ? "btn btn-primary" : "btn"}
                            style={{
                                background: Object.keys(priceActions).length > 0 ? '#2563eb' : '#e2e8f0', // Blue button
                                color: Object.keys(priceActions).length > 0 ? '#fff' : '#94a3b8',
                                border: 'none', cursor: Object.keys(priceActions).length > 0 ? 'pointer' : 'not-allowed',
                                padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: '500'
                            }}>
                            Change Price
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#64748b' }}>Bulk Actions:</span>
                        <button
                            onClick={() => setShowRevertConfirm(true)}
                            disabled={selectedActionItems.size === 0}
                            style={{ opacity: selectedActionItems.size === 0 ? 0.5 : 1, fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412', borderRadius: '4px', cursor: 'pointer' }}>
                            Revert to Pending
                        </button>
                        <button
                            onClick={handleExport}
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#16a34a', border: '1px solid #16a34a', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                            Export CSV
                        </button>
                    </div>
                </div>
            )}

            {loading ? <div>Loading products...</div> : (
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', overflowX: 'auto' }}>
                    {/* Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: activeTab === 'PENDING'
                            ? '50px 10px minmax(200px, 2fr) 100px 100px 100px 100px 200px 80px' // Checkbox | Expander | Generic Structure
                            : '50px minmax(200px, 2fr) 100px 100px 100px 120px', // Completed: Check | Title | Old | New | Action | Date
                        background: '#f1f5f9',
                        padding: '0.75rem 1rem',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        color: '#475569',
                        borderBottom: '1px solid #e2e8f0',
                        minWidth: '920px',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10 // Sticky Header
                    }}>

                        {activeTab === 'PENDING' ? (
                            <>
                                <div><input type="checkbox" checked={products.length > 0 && products.every(p => selectedActionItems.has(p.product_id))} onChange={toggleSelectAll} /></div>
                                <div></div> {/* Expander space */}
                                <div onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>Product Name {sort.col === 'title' && (sort.order === 'asc' ? '↑' : '↓')}</div>
                                <div onClick={() => handleSort('display_price')} style={{ textAlign: 'center', cursor: 'pointer' }}>Ours (RM) {sort.col === 'display_price' && (sort.order === 'asc' ? '↑' : '↓')}</div>
                                <div onClick={() => handleSort('new_price')} style={{ textAlign: 'center', cursor: 'pointer' }}>New (RM) {sort.col === 'new_price' && (sort.order === 'asc' ? '↑' : '↓')}</div>
                                <div onClick={() => handleSort('cheapest_match_display_price')} style={{ textAlign: 'center', cursor: 'pointer' }}>Them (RM) {sort.col === 'cheapest_match_display_price' && (sort.order === 'asc' ? '↑' : '↓')}</div>
                                <div onClick={() => handleSort('worse_index')} style={{ textAlign: 'center', cursor: 'pointer' }}>Index {sort.col === 'worse_index' && (sort.order === 'asc' ? '↑' : '↓')}</div>
                                <div style={{ textAlign: 'center' }}>Action</div>
                                <div></div>
                            </>
                        ) : (
                            // Completed Header
                            <>
                                <div><input type="checkbox" checked={products.length > 0 && products.every(p => selectedActionItems.has(p.product_id))} onChange={toggleSelectAll} /></div>
                                <div onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>Product Name {sort.col === 'title' && (sort.order === 'asc' ? '↑' : '↓')}</div>
                                <div onClick={() => handleSort('history_old_price')} style={{ textAlign: 'center', cursor: 'pointer' }}>Old (RM) {sort.col === 'history_old_price' && (sort.order === 'asc' ? '↑' : '↓')}</div>
                                <div onClick={() => handleSort('history_new_price')} style={{ textAlign: 'center', cursor: 'pointer' }}>New (RM) {sort.col === 'history_new_price' && (sort.order === 'asc' ? '↑' : '↓')}</div>
                                <div style={{ textAlign: 'center' }}>Action</div>
                                <div onClick={() => handleSort('history_created_at')} style={{ textAlign: 'center', cursor: 'pointer' }}>Changed Date {sort.col === 'history_created_at' && (sort.order === 'asc' ? '↑' : '↓')}</div>
                            </>
                        )}
                    </div>

                    {products.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No {activeTab.toLowerCase()} items found.</div>
                    ) : (
                        sortedProducts.map(p => {
                            const isExpanded = expandedRows.has(p.product_id);
                            const action = priceActions[p.product_id] || {};
                            const isSelected = selectedActionItems.has(p.product_id);
                            const hasAction = !!action.type;

                            let worseIndexColor = 'var(--success)';
                            if (p.worse_index_status === 'RED') worseIndexColor = 'var(--danger)';
                            else if (p.worse_index_status === 'ORANGE') worseIndexColor = 'var(--warning)';

                            return (
                                <div key={p.product_id} style={{ borderBottom: '1px solid #f1f5f9', background: isExpanded ? '#f8fafc' : '#fff' }}>
                                    <div
                                        onClick={() => toggleExpand(p.product_id)}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: activeTab === 'PENDING'
                                                ? '50px 10px minmax(200px, 2fr) 100px 100px 100px 100px 200px 80px'
                                                : '50px minmax(200px, 2fr) 100px 100px 100px 120px',
                                            padding: '1rem',
                                            alignItems: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {activeTab === 'PENDING' ? (
                                            <>
                                                <div onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelection(p.product_id)}
                                                    />
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{isExpanded ? '▼' : '▶'}</div>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                                    ) : <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '4px' }} />}
                                                    <div>
                                                        <div style={{ fontWeight: '500', color: '#0f172a', fontSize: '0.9rem' }}>{p.title}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {p.product_id}</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.display_price?.toFixed(2)}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.normalized_price?.toFixed(2)}</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    {/* New (RM) Column: Show Display Price (Big) and Std Price (Small) */}
                                                    <div style={{ fontWeight: 'bold', color: action.newPrice ? '#166534' : '#94a3b8', fontSize: '0.9rem' }}>
                                                        {action.newPrice ? getDerivedDisplayPrice(p, action.newPrice)?.toFixed(2) : '-'}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: action.newPrice ? '#166534' : '#94a3b8' }}>
                                                        {action.newPrice ? action.newPrice.toFixed(2) : '-'}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.cheapest_match_display_price?.toFixed(2) || '-'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.cheapest_match_price?.toFixed(2) || '-'}</div>
                                                </div>
                                                <div style={{ textAlign: 'center', fontWeight: 'bold', color: worseIndexColor, fontSize: '0.9rem' }}>
                                                    {p.worse_index?.toFixed(2)}
                                                </div>
                                                <div onClick={e => e.stopPropagation()} style={{ padding: '0 0.5rem' }}>
                                                    <select
                                                        style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                                        value={action.type || ''}
                                                        onChange={(e) => handleActionChange(p.product_id, e.target.value as any, action.value)}
                                                    >
                                                        <option value="">Select Action...</option>
                                                        <option value="MATCH">Match Cheapest</option>
                                                        <option value="UNDERCUT">Undercut %</option>
                                                        <option value="REDUCE">Reduce %</option>
                                                        <option value="MANUAL">Manual Price</option>
                                                    </select>
                                                    {(action.type === 'UNDERCUT' || action.type === 'REDUCE' || action.type === 'MANUAL') && (
                                                        <input
                                                            type="text"
                                                            placeholder={action.type === 'MANUAL' ? "Price" : "%"}
                                                            style={{ width: '100%', marginTop: '4px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                                            value={action.value || ''}
                                                            onChange={(e) => handleActionChange(p.product_id, action.type, e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                    )}
                                                </div>
                                                <div onClick={e => e.stopPropagation()} style={{ textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => submitPriceChanges([p.product_id])}
                                                        disabled={!hasAction}
                                                        style={{
                                                            padding: '0.3rem 0.6rem',
                                                            fontSize: '0.8rem',
                                                            borderRadius: '4px',
                                                            border: 'none',
                                                            cursor: hasAction ? 'pointer' : 'default',
                                                            background: hasAction ? '#3b82f6' : '#e2e8f0',
                                                            color: hasAction ? '#fff' : '#94a3b8'
                                                        }}
                                                    >
                                                        Change
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            // Completed Row Layout
                                            <>
                                                <div onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelection(p.product_id)}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                                    ) : <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '4px' }} />}
                                                    <div>
                                                        <div style={{ fontWeight: '500', color: '#0f172a' }}>{p.title}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.category}</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'center', color: '#64748b' }}>{p.history_old_price?.toFixed(2) || '-'}</div>
                                                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.history_new_price?.toFixed(2) || '-'}</div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500',
                                                        background: p.history_action_type === 'MATCH' ? '#dbeafe' : p.history_action_type === 'UNDERCUT' ? '#fee2e2' : p.history_action_type === 'REDUCE' ? '#fef3c7' : '#f1f5f9',
                                                        color: p.history_action_type === 'MATCH' ? '#1e40af' : p.history_action_type === 'UNDERCUT' ? '#991b1b' : p.history_action_type === 'REDUCE' ? '#92400e' : '#475569'
                                                    }}>
                                                        {p.history_action_type || '-'}
                                                    </span>
                                                </div>
                                                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                                                    {p.history_created_at ? new Date(p.history_created_at).toLocaleDateString() : '-'}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div style={{ padding: '1rem 1rem 1rem 4rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                                            <CompetitorTable listings={p.listings} worseIndex={p.worse_index} worseIndexStatus={p.worse_index_status} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ padding: '4px 8px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
                                &lt;
                            </button>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{page} / {pagination.totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                style={{ padding: '4px 8px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer', opacity: page === pagination.totalPages ? 0.5 : 1 }}>
                                &gt;
                            </button>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
}
