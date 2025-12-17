import styles from './Card.module.css';

export default function Card({ children, title }: { children: React.ReactNode, title?: string }) {
    return (
        <div className={styles.card}>
            {title && <div className={styles.header}>{title}</div>}
            <div className={styles.body}>
                {children}
            </div>
        </div>
    );
}
