"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStats(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>Loading dashboard...</div>;
    if (!stats) return <div style={{ padding: '2rem', color: '#ef4444' }}>Failed to load dashboard data.</div>;

    const { analytics, actions, history } = stats;

    const cardStyle: React.CSSProperties = {
        background: '#fff',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        border: '1px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    };

    const valueStyle: React.CSSProperties = {
        fontSize: '2.5rem',
        fontWeight: '700',
        color: '#0f172a',
        lineHeight: '1.2'
    };

    const labelStyle: React.CSSProperties = {
        color: '#64748b',
        fontSize: '0.9rem',
        fontWeight: '500',
        marginTop: '0.5rem'
    };

    // Calculate ring segments for donut chart
    const totalStatus = analytics.status.immediate + analytics.status.attention + analytics.status.good;
    const pRed = totalStatus > 0 ? (analytics.status.immediate / totalStatus) * 100 : 0;
    const pOrange = totalStatus > 0 ? (analytics.status.attention / totalStatus) * 100 : 0;
    const pGreen = totalStatus > 0 ? (analytics.status.good / totalStatus) * 100 : 0;

    // Conic gradient for simple donut using CSS
    const donutGradient = `conic-gradient(
        #ef4444 0% ${pRed}%,
        #f59e0b ${pRed}% ${pRed + pOrange}%,
        #22c55e ${pRed + pOrange}% 100%
    )`;

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.025em' }}>Overview</h1>
                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Welcome back. Here's what's happening with your pricing today.</p>
            </div>

            {/* Top Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Card 1: Total Products */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={valueStyle}>{analytics.total_products}</div>
                            <div style={labelStyle}>Total Products</div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Pending Actions */}
                <div
                    style={{ ...cardStyle, cursor: 'pointer', border: '1px solid #bfdbfe', background: '#eff6ff' }}
                    onClick={() => router.push('/actions')}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ ...valueStyle, color: '#1d4ed8' }}>{actions.pending}</div>
                            <div style={{ ...labelStyle, color: '#1e40af' }}>Pending Actions</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: '1rem', fontWeight: '600' }}>
                        Review Actions →
                    </div>
                </div>

                {/* Card 4: Action Velocity (Completed) */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={valueStyle}>{actions.completed}</div>
                            <div style={labelStyle}>Completed Actions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Left Column: Analytics & Health */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Price Health Section */}
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Price Health</h2>
                            <button
                                onClick={() => router.push('/analytics')}
                                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}
                            >
                                View Analytics →
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                            {/* Donut Chart Visual */}
                            <div style={{ position: 'relative', width: '160px', height: '160px', borderRadius: '50%', background: donutGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '120px', height: '120px', background: '#fff', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalStatus}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Matched</div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div style={{ flex: 1 }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
                                            <span style={{ fontWeight: '500', color: '#475569' }}>Immediate Action</span>
                                        </div>
                                        <span style={{ fontWeight: 'bold' }}>{analytics.status.immediate}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                                        <div style={{ width: `${pRed}%`, height: '100%', background: '#ef4444', borderRadius: '3px' }}></div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></div>
                                            <span style={{ fontWeight: '500', color: '#475569' }}>Attention Needed</span>
                                        </div>
                                        <span style={{ fontWeight: 'bold' }}>{analytics.status.attention}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                                        <div style={{ width: `${pOrange}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></div>
                                            <span style={{ fontWeight: '500', color: '#475569' }}>Healthy</span>
                                        </div>
                                        <span style={{ fontWeight: 'bold' }}>{analytics.status.good}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                                        <div style={{ width: `${pGreen}%`, height: '100%', background: '#22c55e', borderRadius: '3px' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Activity */}
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem' }}>Recent Actions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {history.length === 0 ? (
                            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No recent activity.</div>
                        ) : (
                            history.map((h: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: idx < history.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '8px',
                                        background: h.change_type === 'MATCH' ? '#f0f9ff' : h.change_type === 'UNDERCUT' ? '#fdf2f8' : '#fff7ed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: h.change_type === 'MATCH' ? '#0ea5e9' : h.change_type === 'UNDERCUT' ? '#db2777' : '#ea580c',
                                        fontSize: '1.2rem'
                                    }}>
                                        {h.change_type === 'MATCH' ? 'M' : h.change_type === 'UNDERCUT' ? 'U' : 'R'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>{h.product?.title || 'Unknown Product'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            {h.change_type} • <span style={{ textDecoration: 'line-through' }}>{Number(h.old_price).toFixed(2)}</span> → <b>{Number(h.new_price).toFixed(2)}</b>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                        {new Date(h.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {history.length > 0 && (
                        <div style={{ marginTop: 'auto', paddingTop: '1rem', textAlign: 'center' }}>
                            <button
                                onClick={() => router.push('/actions?tab=COMPLETED')}
                                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                View Full History
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
