'use client';

import { useState } from 'react';

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
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                background: '#fff', padding: '2rem', borderRadius: '8px',
                maxWidth: '400px', width: '90%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#0f172a' }}>{title}</h3>
                {message && <p style={{ color: '#64748b', marginBottom: '1rem' }}>{message}</p>}

                <input
                    type="text"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={placeholder}
                    autoFocus
                    style={{
                        width: '100%', padding: '0.75rem', borderRadius: '4px',
                        border: '1px solid #cbd5e1', marginBottom: '1.5rem',
                        fontSize: '1rem'
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        className="btn"
                        style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#475569' }}
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
