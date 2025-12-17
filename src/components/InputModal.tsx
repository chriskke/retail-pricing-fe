'use client';

import { useState } from 'react';
import styles from '../styles/Modal.module.css';

interface InputModalProps {
    isOpen: boolean;
    title: string;
    message?: string;
    placeholder?: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

export default function InputModal({
    isOpen,
    title,
    message,
    placeholder,
    defaultValue = '',
    onConfirm,
    onCancel
}: InputModalProps) {
    const [value, setValue] = useState(defaultValue);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm(value);
        setValue(defaultValue); // Reset
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h3 className={styles.title}>{title}</h3>
                {message && <p className={styles.message}>{message}</p>}

                <input
                    type="text"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={placeholder}
                    autoFocus
                    className={styles.input}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />

                <div className={styles.actions}>
                    <button
                        onClick={onCancel}
                        className={`btn ${styles.cancelBtn}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="btn btn-primary"
                        disabled={!value}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
