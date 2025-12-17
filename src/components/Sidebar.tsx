'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';

const menuItems = [
    { name: 'Import Data', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Action Board', path: '/actions' },
    { name: 'Settings', path: '/settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        if (collapsed) {
            root.style.setProperty('--sidebar-width', '64px');
        } else {
            root.style.setProperty('--sidebar-width', '250px');
        }
    }, [collapsed]);

    const getIcon = (name: string) => {
        switch (name) {
            case 'Import Data': return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
            case 'Dashboard': return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
            case 'Analytics': return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
            case 'Action Board': return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
            case 'Settings': return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
            default: return null;
        }
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo} style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '0' : '0 1.5rem', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {collapsed ? 'RA' : 'RetailAnalytics'}
            </div>

            <nav className={styles.nav} style={{ flex: 1 }}>
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`${styles.link} ${pathname === item.path ? styles.active : ''}`}
                        title={collapsed ? item.name : ''}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '0.75rem', padding: collapsed ? '0.75rem 0' : '0.75rem 1rem' }}
                    >
                        {getIcon(item.name)}
                        {!collapsed && <span>{item.name}</span>}
                    </Link>
                ))}
            </nav>

            <button
                onClick={() => setCollapsed(!collapsed)}
                className={styles.link}
                style={{
                    borderTop: '1px solid var(--border-color)',
                    borderRadius: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    borderTopWidth: '1px',
                    borderTopStyle: 'solid',
                    borderTopColor: 'var(--border-color)',
                    cursor: 'pointer',
                    width: '100%'
                }}
            >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {!collapsed && <span>Minimize</span>}
            </button>
        </aside>
    );
}
