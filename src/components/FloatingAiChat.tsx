'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const STORAGE_KEY_MESSAGES = 'ai_chat_messages';
const STORAGE_KEY_OPEN = 'ai_chat_open';

export default function FloatingAiChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load messages and open state from localStorage on mount
    useEffect(() => {
        const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
        const savedOpen = localStorage.getItem(STORAGE_KEY_OPEN);

        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
            } catch (e) {
                console.error('Failed to parse saved messages', e);
            }
        }

        if (savedOpen === 'true') {
            setIsOpen(true);
        }
    }, []);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
        }
    }, [messages]);

    // Save open state to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_OPEN, isOpen.toString());
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = query;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setQuery('');
        setLoading(true);
        setStreamingContent('');

        try {
            const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/analytics/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMsg, stream: true })
            });

            if (!res.ok || !res.body) {
                throw new Error('Failed to get response');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            setMessages(prev => [...prev, { role: 'assistant', content: accumulatedContent }]);
                            setStreamingContent('');
                            break;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                accumulatedContent += parsed.content;
                                setStreamingContent(accumulatedContent);
                            }
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                }
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to AI server." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999,
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
            >
                {isOpen ? '×' : 'AI'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '96px',
                    right: '24px',
                    width: '380px',
                    maxWidth: 'calc(100vw - 48px)',
                    height: '580px',
                    maxHeight: 'calc(100vh - 140px)',
                    background: '#fff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    zIndex: 998
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid #e5e7eb',
                        background: '#fff'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#111827' }}>AI Assistant</h3>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>Ask anything about your data</p>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        background: '#fafafa'
                    }}>
                        {messages.length === 0 && !streamingContent && (
                            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '2rem' }}>
                                <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#6b7280' }}>Start by asking a question</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '80%'
                            }}>
                                <div style={{
                                    padding: '0.625rem 0.875rem',
                                    borderRadius: '8px',
                                    background: msg.role === 'user' ? '#3b82f6' : '#fff',
                                    color: msg.role === 'user' ? '#fff' : '#111827',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.5',
                                    border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {streamingContent && (
                            <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                                <div style={{
                                    padding: '0.625rem 0.875rem',
                                    borderRadius: '8px',
                                    background: '#fff',
                                    color: '#111827',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.5',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    {streamingContent}
                                    <span style={{ display: 'inline-block', width: '2px', height: '1em', background: '#3b82f6', marginLeft: '2px', animation: 'blink 1s infinite' }} />
                                </div>
                            </div>
                        )}

                        {loading && !streamingContent && (
                            <div style={{ alignSelf: 'flex-start', padding: '0.625rem 0.875rem', background: '#fff', borderRadius: '8px', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} style={{
                        padding: '0.875rem',
                        borderTop: '1px solid #e5e7eb',
                        background: '#fff'
                    }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Ask a question..."
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '0.625rem 0.875rem',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            />
                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                style={{
                                    padding: '0.625rem 1rem',
                                    background: '#3b82f6',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                                    opacity: loading || !query.trim() ? 0.5 : 1,
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <style jsx>{`
                .suggestion-chip {
                    background: #fff;
                    padding: 0.625rem 0.875rem;
                    borderRadius: 8px;
                    fontSize: 0.8rem;
                    cursor: pointer;
                    border: 1px solid #e5e7eb;
                    text-align: left;
                    color: #374151;
                    transition: all 0.2s;
                }
                .suggestion-chip:hover {
                    background: #f9fafb;
                    border-color: #d1d5db;
                }

                .typing-indicator {
                    display: flex;
                    gap: 4px;
                }
                .typing-indicator span {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #3b82f6;
                    animation: typing 1.4s infinite;
                }
                .typing-indicator span:nth-child(1) {
                    animation-delay: 0s;
                }
                .typing-indicator span:nth-child(2) {
                    animation-delay: 0.2s;
                }
                .typing-indicator span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes typing {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.4;
                    }
                    30% {
                        transform: translateY(-6px);
                        opacity: 1;
                    }
                }

                @keyframes blink {
                    0%, 49% {
                        opacity: 1;
                    }
                    50%, 100% {
                        opacity: 0;
                    }
                }
            `}</style>
        </>
    );
}
