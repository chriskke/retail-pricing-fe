'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CompetitorStats {
    vendor: string;
    matches: number;
    cheaper_than_us: number;
    cheaper_than_us_pct: number;
    win_count: number;
    win_rate: number;
    cheapest_anchor: number;
    confidence_coverage: {
        high: number;
        medium: number;
        low: number;
        high_pct: number;
    };
}

interface CompetitorOverviewTableProps {
    data: CompetitorStats[];
    loading: boolean;
    sort: { col: string, order: 'asc' | 'desc' };
    handleSort: (col: string) => void;
}

export default function CompetitorOverviewTable({ data, loading, sort, handleSort }: CompetitorOverviewTableProps) {
    const router = useRouter();
    // Removed early return for loading to preserve layout/scroll

    const renderHeader = (label: string, colKey: string, align: 'left' | 'center' | 'right' = 'center') => (
        <th
            style={{
                padding: '1rem', textAlign: align, cursor: 'pointer', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem',
                position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.05)'
            }}
            onClick={() => handleSort(colKey)}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end', gap: '4px' }}>
                {label}
                {sort.col === colKey && (
                    <span style={{ fontSize: '0.7rem' }}>{sort.order === 'asc' ? '▲' : '▼'}</span>
                )}
            </div>
        </th>
    );

    return (
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
            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', overflowX: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f8fafc' }}>
                        <tr>
                            {renderHeader('Competitor Name', 'vendor', 'left')}
                            {renderHeader('Products Compared', 'matches')}
                            {renderHeader('% We are Cheaper', 'win_rate')}
                            {renderHeader('% They are Cheaper', 'cheaper_than_us_pct')}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                    No competitor data found matching filters.
                                </td>
                            </tr>
                        ) : (
                            data.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                                    <td onClick={() => router.push(`/analytics?tab=products&competitor=${encodeURIComponent(row.vendor)}`)} style={{ padding: '1rem', fontWeight: '500', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}>
                                        {row.vendor}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {row.matches}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontWeight: '500', fontSize: '0.85rem',
                                                background: row.win_rate > 50 ? '#dcfce7' : '#f1f5f9',
                                                color: row.win_rate > 50 ? '#166534' : '#334155'
                                            }}>
                                                {row.win_rate.toFixed(1)}%
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {row.win_count} Products
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontWeight: '500', fontSize: '0.85rem',
                                                background: row.cheaper_than_us_pct > 50 ? '#fee2e2' : '#f1f5f9',
                                                color: row.cheaper_than_us_pct > 50 ? '#991b1b' : '#334155'
                                            }}>
                                                {row.cheaper_than_us_pct.toFixed(1)}%
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {row.cheaper_than_us} Products
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
