import styles from '../styles/globals.css';

export default function Placeholder({ title }: { title: string }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            border: '2px dashed var(--border-color)',
            borderRadius: '12px',
            padding: '4rem'
        }}>
            <h2>{title}</h2>
            <p>This module is under construction.</p>
        </div>
    );
}
