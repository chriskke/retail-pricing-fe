'use client';

import { useState, useRef, useEffect } from 'react';

interface AiChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function AiChatModal({ isOpen, onClose }: AiChatModalProps) {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = query;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setQuery('');
        setLoading(true);

        try {
            const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/analytics/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMsg })
            });
            const data = await res.json();

            if (data.answer) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
            } else if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: "Error: " + data.error }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong." }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to AI server." }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)'
        }} onClick={onClose}>
            <div
                style={{
                    width: '600px', maxWidth: '90vw', height: '70vh',
                    background: '#fff', borderRadius: '12px', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f8fafc'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>✨</span>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>AI Analyst</h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                    >
                        &times;
                    </button>
                </div>

                {/* Messages Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff' }}>
                    {messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👋</div>
                            <p>Ask anything about your products, competitors, or prices.</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                                <span className="chip" onClick={() => setQuery("Which products are overpriced?")}>"Which products are overpriced?"</span>
                                <span className="chip" onClick={() => setQuery("Count products requiring immediate action")}>"Count immediate action products"</span>
                                <span className="chip" onClick={() => setQuery("What is the average price of Drill?")}>"Avg price of drills"</span>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%'
                        }}>
                            <div style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                background: msg.role === 'user' ? '#0f172a' : '#f1f5f9',
                                color: msg.role === 'user' ? '#fff' : '#0f172a',
                                borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                                borderTopLeftRadius: msg.role === 'user' ? '12px' : '2px',
                                lineHeight: '1.5'
                            }}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', background: '#f1f5f9', borderRadius: '12px', color: '#64748b' }}>
                            Thinking...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Ask a question..."
                            style={{
                                flex: 1, padding: '0.75rem 1rem', borderRadius: '8px',
                                border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            style={{
                                padding: '0.75rem 1.5rem', background: '#0f172a', color: '#fff',
                                border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .chip {
                    background: #f1f5f9;
                    padding: 0.25rem 0.75rem;
                    border-radius: 16px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    border: 1px solid #e2e8f0;
                }
                .chip:hover {
                    background: #e2e8f0;
                }
            `}</style>
        </div>
    );
}
