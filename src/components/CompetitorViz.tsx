import React from 'react';
import { useRouter } from 'next/navigation';

interface CompetitorStats {
    vendor: string;
    matches: number;
    cheaper_than_us: number;
    cheaper_than_us_pct: number;
    win_count: number;
    win_rate: number;
    cheapest_anchor: number;
}

interface CompetitorVizProps {
    data: CompetitorStats[];
}

export default function CompetitorViz({ data }: CompetitorVizProps) {
    const router = useRouter();

    // Sort by "They are Cheaper" (Count first)
    const theyCheaper = [...data]
        .filter(c => c.cheaper_than_us > 0)
        .sort((a, b) => b.cheaper_than_us - a.cheaper_than_us)
        .slice(0, 5);

    // Sort by "We are Cheaper" (Count first)
    const weCheaper = [...data]
        .filter(c => c.win_count > 0)
        .sort((a, b) => b.win_count - a.win_count)
        .slice(0, 5);

    const renderBar = (stats: CompetitorStats, type: 'THEY' | 'WE') => {
        const pct = type === 'THEY' ? stats.cheaper_than_us_pct : stats.win_rate;
        const count = type === 'THEY' ? stats.cheaper_than_us : stats.win_count;
        const color = type === 'THEY' ? '#ef4444' : '#22c55e';
        const bg = type === 'THEY' ? '#fee2e2' : '#dcfce7';

        return (
            <div key={stats.vendor} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{stats.vendor}</span>
                    <span style={{ color: '#64748b' }}>{count} products ({pct.toFixed(1)}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px' }}></div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                        Products Where Competitors Are Cheaper
                    </h3>
                    <button
                        onClick={() => router.push('/analytics?tab=competitors')}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}
                    >
                        View More →
                    </button>
                </div>
                {theyCheaper.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No data available.</div>
                ) : (
                    theyCheaper.map(c => renderBar(c, 'THEY'))
                )}
            </div>

            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                        Products Where We Are Cheaper
                    </h3>
                    <button
                        onClick={() => router.push('/analytics?tab=competitors')}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}
                    >
                        View More →
                    </button>
                </div>
                {weCheaper.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No data available.</div>
                ) : (
                    weCheaper.map(c => renderBar(c, 'WE'))
                )}
            </div>
        </div>
    );
}
