'use client';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isProcessing?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isProcessing = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

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
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{message}</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="btn"
                        style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#475569' }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="btn btn-danger"
                    >
                        {isProcessing ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
