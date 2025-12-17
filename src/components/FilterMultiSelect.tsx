'use client';

import { useState, useRef, useEffect } from 'react';

export type FilterOption = string | { label: string; value: string };

interface FilterMultiSelectProps {
    label: string;
    options: FilterOption[];
    selected: string[];
    onChange: (value: string) => void;
}

export default function FilterMultiSelect({ label, options, selected, onChange }: FilterMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper to get label/value
    const getOptionLabel = (opt: FilterOption) => typeof opt === 'string' ? opt : opt.label;
    const getOptionValue = (opt: FilterOption) => typeof opt === 'string' ? opt : opt.value;

    const filteredOptions = options.filter(opt =>
        getOptionLabel(opt).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '0.5rem 1rem',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
            >
                {label}
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>▼</span>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '120%',
                    left: 0,
                    width: '240px',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}
                            autoFocus
                        />
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => {
                                const val = getOptionValue(opt);
                                const lab = getOptionLabel(opt);
                                const isSelected = selected.includes(val);
                                return (
                                    <div
                                        key={val}
                                        onClick={() => onChange(val)}
                                        style={{
                                            padding: '0.4rem 0.6rem',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            background: isSelected ? '#f0f9ff' : 'transparent',
                                            color: isSelected ? '#0284c7' : '#334155',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = isSelected ? '#e0f2fe' : '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? '#f0f9ff' : 'transparent'}
                                    >
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lab}</span>
                                        {isSelected && <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>✓</span>}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>No results</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
