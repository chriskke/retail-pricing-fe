'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { Icons } from './Icons';

const menuItems = [
    { name: 'Import Data', path: '/', icon: 'Import' },
    { name: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
    { name: 'Analytics', path: '/analytics', icon: 'Analytics' },
    { name: 'Action Board', path: '/actions', icon: 'ActionBoard' },
    { name: 'Settings', path: '/settings', icon: 'Settings' },
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
        const IconComponent = Icons[name as keyof typeof Icons];
        return IconComponent ? <IconComponent /> : null;
    };

    return (
        <aside className={styles.sidebar}>
            <div className={`${styles.logo} ${collapsed ? styles.collapsed : ''}`}>
                {collapsed ? 'RA' : 'RetailAnalytics'}
            </div>

            <nav className={styles.nav}>
                {menuItems.map((item) => {
                    const Icon = Icons[item.icon as keyof typeof Icons];
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`${styles.link} ${pathname === item.path ? styles.active : ''} ${collapsed ? styles.collapsed : ''}`}
                            title={collapsed ? item.name : ''}
                        >
                            <span className={styles.iconWrapper}>
                                {Icon && <Icon />}
                            </span>
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <button
                onClick={() => setCollapsed(!collapsed)}
                className={`${styles.toggleButton} ${collapsed ? styles.collapsed : ''}`}
            >
                <div className={`${styles.toggleIcon} ${collapsed ? styles.collapsed : ''}`}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
                {!collapsed && <span>Minimize</span>}
            </button>
        </aside>
    );
}
