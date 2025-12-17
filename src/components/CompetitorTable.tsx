'use client';

import { useState } from 'react';

interface CompetitorTableProps {
    listings: any[];
    worseIndex: number;
    worseIndexStatus: string;
}

export default function CompetitorTable({ listings, worseIndex, worseIndexStatus }: CompetitorTableProps) {
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ col: string, order: 'asc' | 'desc' }>({ col: 'price_index', order: 'desc' });
    const LIMIT = 5;

    const sortedListings = [...listings].sort((a, b) => {
        let valA = a[sort.col];
        let valB = b[sort.col];

        if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB) * (sort.order === 'asc' ? 1 : -1);
        }
        return (valA - valB) * (sort.order === 'asc' ? 1 : -1);
    });

    const totalPages = Math.ceil(sortedListings.length / LIMIT);
    const paginatedListings = sortedListings.slice((page - 1) * LIMIT, page * LIMIT);

    const handleSort = (col: string) => {
        setSort(prev => ({
            col,
            order: prev.col === col && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div style={{ background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '1rem' }}>
            <h5 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b' }}>Competitor Analysis</h5>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ color: '#64748b', textAlign: 'left' }}>
                            <th style={{ paddingBottom: '0.5rem', width: '50px' }}>Img</th>
                            <th style={{ paddingBottom: '0.5rem', cursor: 'pointer' }} onClick={() => handleSort('vendor')}>
                                Competitor {sort.col === 'vendor' && (sort.order === 'asc' ? '▲' : '▼')}
                            </th>
                            <th style={{ paddingBottom: '0.5rem', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('display_price')}>
                                Prices (RM) {sort.col === 'display_price' && (sort.order === 'asc' ? '▲' : '▼')}
                            </th>
                            <th style={{ paddingBottom: '0.5rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('price_index')}>
                                Index {sort.col === 'price_index' && (sort.order === 'asc' ? '▲' : '▼')}
                            </th>
                            <th style={{ paddingBottom: '0.5rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('matching_score')}>
                                Confidence {sort.col === 'matching_score' && (sort.order === 'asc' ? '▲' : '▼')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedListings.map((l: any, idx: number) => {
                            const handleClick = () => {
                                if (l.competitor_link) window.open(l.competitor_link, '_blank');
                            };

                            return (
                                <tr key={idx} style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    cursor: l.competitor_link ? 'pointer' : 'default'
                                }} onClick={handleClick}>
                                    <td style={{ padding: '0.5rem 0' }}>
                                        {l.competitor_image_url ? (
                                            <img src={l.competitor_image_url} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                                        ) : <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '4px' }} />}
                                    </td>
                                    <td style={{ padding: '0.5rem 0' }}>
                                        <div style={{ fontWeight: '500', color: l.competitor_link ? '#0f172a' : '#334155' }}>{l.vendor}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{l.competitor_title}</div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '1rem', verticalAlign: 'middle' }}>
                                        <div style={{ fontWeight: '500' }}>{l.display_price?.toFixed(2)}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Std: {l.normalized_price?.toFixed(2)}</div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle', color: l.raw_status === 'RED' ? 'var(--danger)' : l.raw_status === 'ORANGE' ? 'var(--warning)' : 'var(--success)' }}>
                                        {l.price_index?.toFixed(2)}
                                    </td>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        <span style={{
                                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500',
                                            background: l.confidence_level === 'HIGH' ? '#dcfce7' : l.confidence_level === 'MEDIUM' ? '#fef3c7' : '#f1f5f9',
                                            color: l.confidence_level === 'HIGH' ? '#166534' : l.confidence_level === 'MEDIUM' ? '#92400e' : '#64748b'
                                        }}>
                                            {l.confidence_level}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{ padding: '4px 8px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
                        &lt;
                    </button>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        style={{ padding: '4px 8px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>
                        &gt;
                    </button>
                </div>
            )}
        </div>
    );
}

