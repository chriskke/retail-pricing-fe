'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    duration?: number;
    onClose: () => void;
}

export default function ToastNotification({ message, type, duration = 3000, onClose }: ToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true); // Trigger fade in
        const timer = setTimeout(() => {
            setVisible(false); // Trigger fade out
            setTimeout(onClose, 300); // Remove after animation
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: `translateX(-50%) translateY(${visible ? '0' : '-20px'})`,
            opacity: visible ? 1 : 0,
            transition: 'all 0.3s ease-in-out',
            zIndex: 9999,
            background: type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 500
        }}>
            <span>{type === 'success' ? '✓' : '⚠'}</span>
            <span>{message}</span>
        </div>
    );
}
