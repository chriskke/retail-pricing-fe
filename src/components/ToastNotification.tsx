'use client';

import { useEffect, useState } from 'react';
import styles from './ToastNotification.module.css';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    duration?: number;
    onClose: () => void;
}

export default function ToastNotification({ message, type, duration = 3000, onClose }: ToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Small delay to ensure the initial render happens before the animation class is added
        const timerIn = setTimeout(() => setVisible(true), 10);

        const timerOut = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300); // Remove after animation
        }, duration);

        return () => {
            clearTimeout(timerIn);
            clearTimeout(timerOut);
        };
    }, [duration, onClose]);

    return (
        <div className={`${styles.toast} ${visible ? styles.visible : ''} ${type === 'success' ? styles.success : styles.error}`}>
            <span>{type === 'success' ? '✓' : '⚠'}</span>
            <span>{message}</span>
        </div>
    );
}
