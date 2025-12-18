'use client';

import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        confidence_high: 0.85,
        confidence_medium: 0.60,
        overprice_threshold: 1.10
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Fetch settings from API
        fetch(process.env.NEXT_PUBLIC_API_URL + '/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            })
            .catch(console.error);
    }, []);

    const saveSettings = () => {
        setSaving(true);
        fetch(process.env.NEXT_PUBLIC_API_URL + '/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        })
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setSaving(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            })
            .catch(err => {
                console.error(err);
                setSaving(false);
            });
    };

    const handleConfidenceChange = (val: number | number[]) => {
        if (Array.isArray(val)) {
            setSettings(prev => ({
                ...prev,
                confidence_medium: val[0],
                confidence_high: val[1]
            }));
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading settings...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header - Standardized */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f172a' }}>Settings</h1>
                    <p style={{ color: '#64748b' }}>Manage your application preferences.</p>
                </div>
            </div>

            <Card title="Overprice Threshold">
                <div style={{ padding: '1rem 0 1rem 0' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                        Set the Unit Price Index threshold for identifying overpriced products.
                    </p>

                    <div style={{ padding: '0 1rem' }}>
                        <Slider
                            min={1.0}
                            max={2.0}
                            step={0.01}
                            value={settings.overprice_threshold}
                            onChange={(val) => setSettings(prev => ({ ...prev, overprice_threshold: val as number }))}
                            trackStyle={{ backgroundColor: 'var(--danger)' }}
                            handleStyle={{ borderColor: 'var(--danger)' }}
                            marks={{
                                1.0: '1.0',
                                1.1: '1.10 (Default)',
                                1.5: '1.5',
                                2.0: '2.0'
                            }}
                        />
                    </div>

                    <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', display: 'inline-block', minWidth: '200px' }}>
                            <div style={{ fontSize: '0.9rem', color: '#991b1b' }}>Alert Threshold</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>{settings.overprice_threshold.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Confidence Levels">
                <div style={{ padding: '1rem 0 2rem 0' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                        Set the matching score thresholds. Drag the knobs to define <strong>Low</strong>, <strong>Medium</strong>, and <strong>High</strong> confidence ranges.
                    </p>

                    <div style={{ padding: '0 1rem' }}>
                        <Slider
                            range
                            min={0}
                            max={1}
                            step={0.01}
                            value={[settings.confidence_medium, settings.confidence_high]}
                            onChange={handleConfidenceChange}
                            trackStyle={[{ background: 'transparent' }]} // Hide default track
                            railStyle={{
                                background: `linear-gradient(to right,
                                    #94a3b8 0%,
                                    #94a3b8 ${settings.confidence_medium * 100}%,
                                    #eab308 ${settings.confidence_medium * 100}%,
                                    #eab308 ${settings.confidence_high * 100}%,
                                    #22c55e ${settings.confidence_high * 100}%,
                                    #22c55e 100%)`,
                                height: 6
                            }}
                            handleStyle={[
                                { borderColor: '#94a3b8', background: '#fff', opacity: 1 },
                                { borderColor: '#22c55e', background: '#fff', opacity: 1 }
                            ]}
                            marks={{
                                0: '0',
                                0.6: '0.6',
                                0.8: '0.8',
                                1: '1.0'
                            }}
                        />
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--background-light)', borderRadius: '8px' }}>
                            <span style={{ fontWeight: '500' }}>Low Confidence Range</span>
                            <span style={{ fontFamily: 'monospace' }}>0 - {(settings.confidence_medium - 0.01).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--background-light)', borderRadius: '8px' }}>
                            <span style={{ fontWeight: '500' }}>Medium Confidence Range</span>
                            <span style={{ fontFamily: 'monospace' }}>{settings.confidence_medium.toFixed(2)} - {(settings.confidence_high - 0.01).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--background-light)', borderRadius: '8px' }}>
                            <span style={{ fontWeight: '500' }}>High Confidence Range</span>
                            <span style={{ fontFamily: 'monospace' }}>{settings.confidence_high.toFixed(2)} - 1.00</span>
                        </div>
                    </div>
                </div>
            </Card>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.5rem', minWidth: '120px', fontSize: '0.9rem' }}
                >
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
                </button>
            </div>
        </div>
    );
}
