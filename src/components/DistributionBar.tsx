'use client';

interface DistributionBarProps {
    red: number;
    orange: number;
    green: number;
}

export default function DistributionBar({ red, orange, green }: DistributionBarProps) {
    const total = red + orange + green;
    if (total === 0) return <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px' }} />;

    const redPct = (red / total) * 100;
    const orangePct = (orange / total) * 100;
    const greenPct = (green / total) * 100;

    return (
        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', width: '100px', background: '#eee' }}>
            {red > 0 && <div style={{ width: `${redPct}%`, background: 'var(--danger)' }} title={`Overpriced: ${red}`} />}
            {orange > 0 && <div style={{ width: `${orangePct}%`, background: 'var(--warning)' }} title={`Attention Needed: ${orange}`} />}
            {green > 0 && <div style={{ width: `${greenPct}%`, background: 'var(--success)' }} title={`No Action: ${green}`} />}
        </div>
    );
}
