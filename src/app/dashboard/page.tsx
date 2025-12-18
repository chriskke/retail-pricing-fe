"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CompetitorViz from '../../components/CompetitorViz';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [competitorStats, setCompetitorStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`).then(res => res.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/competitors`).then(res => res.json())
        ])
            .then(([dashboardData, compData]) => {
                if (dashboardData.success) {
                    setStats(dashboardData);
                }
                if (compData.competitors) {
                    setCompetitorStats(compData);
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
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f172a' }}>Overview</h1>
                    <p style={{ color: '#64748b' }}>Welcome back. Here's what's happening with your pricing today.</p>
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className={styles.statsGrid}>
                {/* Card 1: Main Metric (Products to Review) */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <div className={styles.metricValue}>{analytics.total_products}</div>
                            <div className={styles.metricLabel}>Products to Review</div>
                        </div>
                    </div>
                    {/* LINK FIX: Products to Review -> Analytics (Product View) */}
                    <div
                        className={styles.cardLink}
                        onClick={() => router.push('/analytics?tab=products')}
                    >
                        Review →
                    </div>
                </div>

                {/* Card 2: Pending Actions */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <div className={styles.metricValue}>{actions.pending}</div>
                            <div className={styles.metricLabel}>Pending Actions</div>
                        </div>
                    </div>
                    <div
                        className={styles.cardLink}
                        onClick={() => router.push('/actions')}
                    >
                        Review →
                    </div>
                </div>

                {/* Card 3: Action Velocity (Completed) */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <div className={styles.metricValue}>{actions.completed}</div>
                            <div className={styles.metricLabel}>Completed Actions</div>
                        </div>
                    </div>
                    {/* LINK FIX: Completed Actions -> Action Board (Completed View) */}
                    <div
                        className={styles.cardLink}
                        onClick={() => router.push('/actions?tab=COMPLETED')}
                    >
                        Review →
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className={styles.mainGrid}>

                {/* Left Column: Analytics & Health */}

                {/* Price Health Section */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Price Health</h2>
                        <button
                            onClick={() => router.push('/analytics')}
                            className={styles.cardLink}
                        >
                            View Analytics →
                        </button>
                    </div>

                    <div className={styles.chartContainer}>
                        {/* Donut Chart Visual */}
                        <div className={styles.donutWrapper} style={{ background: donutGradient }}>
                            <div className={styles.donutInner}>
                                <div className={styles.donutTotal}>{totalStatus}</div>
                                <div className={styles.donutLabel}>Matched</div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className={styles.legendContainer}>
                            <div className={styles.legendItem}>
                                <div className={styles.legendHeader}>
                                    <div className={styles.legendLabelGroup}>
                                        <div className={styles.legendDot} style={{ background: '#ef4444' }}></div>
                                        <span className={styles.legendLabel}>Immediate Action</span>
                                    </div>
                                    <span className={styles.legendValue}>{analytics.status.immediate}</span>
                                </div>
                                <div className={styles.progressBarBack}>
                                    <div className={styles.progressBarFill} style={{ width: `${pRed}%`, background: '#ef4444' }}></div>
                                </div>
                            </div>

                            <div className={styles.legendItem}>
                                <div className={styles.legendHeader}>
                                    <div className={styles.legendLabelGroup}>
                                        <div className={styles.legendDot} style={{ background: '#f59e0b' }}></div>
                                        <span className={styles.legendLabel}>Attention Needed</span>
                                    </div>
                                    <span className={styles.legendValue}>{analytics.status.attention}</span>
                                </div>
                                <div className={styles.progressBarBack}>
                                    <div className={styles.progressBarFill} style={{ width: `${pOrange}%`, background: '#f59e0b' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className={styles.legendHeader}>
                                    <div className={styles.legendLabelGroup}>
                                        <div className={styles.legendDot} style={{ background: '#22c55e' }}></div>
                                        <span className={styles.legendLabel}>Healthy</span>
                                    </div>
                                    <span className={styles.legendValue}>{analytics.status.good}</span>
                                </div>
                                <div className={styles.progressBarBack}>
                                    <div className={styles.progressBarFill} style={{ width: `${pGreen}%`, background: '#22c55e' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Activity */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Recent Actions</h2>
                        <button
                            onClick={() => router.push('/actions?tab=COMPLETED')} // Route to Completed Actions
                            className={styles.cardLink} // Reuse same style
                        >
                            View More →
                        </button>
                    </div>
                    <div className={styles.recentList}>
                        {history.length === 0 ? (
                            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No recent activity.</div>
                        ) : (
                            history.map((h: any, idx: number) => (
                                <div key={idx} className={styles.recentItem}>
                                    <div className={styles.iconBox} style={{
                                        background: h.change_type === 'MATCH' ? '#f0f9ff' : h.change_type === 'UNDERCUT' ? '#fdf2f8' : '#fff7ed',
                                        color: h.change_type === 'MATCH' ? '#0ea5e9' : h.change_type === 'UNDERCUT' ? '#db2777' : '#ea580c',
                                    }}>
                                        {h.change_type === 'MATCH' ? 'M' : h.change_type === 'UNDERCUT' ? 'U' : 'R'}
                                    </div>
                                    <div className={styles.recentDetails}>
                                        <div className={styles.productTitle}>{h.product?.title || 'Unknown Product'}</div>
                                        <div className={styles.priceChange}>
                                            {h.change_type} • <span className={styles.oldPrice}>{Number(h.old_price).toFixed(2)}</span> → <b className={styles.newPrice}>{Number(h.new_price).toFixed(2)}</b>
                                        </div>
                                    </div>
                                    <div className={styles.date}>
                                        {new Date(h.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Competitor Dashboard */}
            <div className={styles.competitorSection}>
                {competitorStats && (
                    <CompetitorViz data={competitorStats.competitors} />
                )}
            </div>

        </div >
    );
}
