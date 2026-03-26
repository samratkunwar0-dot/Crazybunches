import { useState, useEffect, useRef } from 'react';

function ChatArea({ activeCorner, currentUser, socket }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!activeCorner) return;
        fetch(`/api/corners/${activeCorner.id}/messages`)
            .then(r => r.json())
            .then(data => { setMessages(data); scrollToBottom(); })
            .catch(console.error);

        socket.emit('join_corner', { cornerId: activeCorner.id });
    }, [activeCorner, socket]);

    useEffect(() => {
        const handler = (msg) => setMessages(prev => [...prev, msg]);
        const blockedHandler = ({ message }) => alert(message);
        socket.on('receive_message', handler);
        socket.on('moderation_blocked', blockedHandler);
        return () => {
            socket.off('receive_message', handler);
            socket.off('moderation_blocked', blockedHandler);
        };
    }, [socket]);

    useEffect(() => scrollToBottom(), [messages]);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !activeCorner) return;
        socket.emit('send_message', { cornerId: activeCorner.id, userId: currentUser.id, content: inputValue.trim() });
        setInputValue('');
    };

    const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!activeCorner) return (
        <div className="chat-wrapper" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
                <p>Select a corner to start chatting</p>
            </div>
        </div>
    );

    return (
        <div className="chat-wrapper">
            <div className="chat-header">
                <span className="hash">#</span>
                <h3>{activeCorner.name}</h3>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                    Type /Ask [question] to chat with the bot
                </span>
            </div>

            <div className="messages-container">
                {messages.map((msg) => (
                    <div key={msg.id} className="message-item">
                        <div
                            className="message-avatar"
                            style={{ background: msg.bannerColor || '#5c64f2' }}
                        >
                            {msg.pfpUrl
                                ? <img src={msg.pfpUrl} alt="pfp" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                : (msg.displayName || msg.username).charAt(0).toUpperCase()
                            }
                        </div>
                        <div className="message-content">
                            <div className="message-header">
                                <span className={`message-author ${msg.role === 'admin' ? 'author-admin' : msg.hasNitro ? 'author-nitro' : ''}`}>
                                    {msg.displayName || msg.username}
                                    {msg.role === 'admin' && <span className="role-badge admin-badge">Admin</span>}
                                    {msg.role === 'bot' && <span className="role-badge bot-badge">BOT</span>}
                                    {msg.hasNitro && msg.role === 'user' && <span className="nitro-pill">NITRO</span>}
                                </span>
                                <span className="message-timestamp">{formatTime(msg.timestamp)}</span>
                            </div>
                            <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrapper">
                <form className="chat-input" onSubmit={handleSend}>
                    <input
                        type="text"
                        placeholder={`Message #${activeCorner.name}  (or /Ask anything)`}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                    />
                    <button type="submit" className="send-btn">➤</button>
                </form>
            </div>
        </div>
    );
}

export default ChatArea;
