import { useState } from 'react';

const ACTIONS = [
    { key: 'timeout', label: '⏱ Timeout', color: '#faa61a', desc: 'Block messages temporarily' },
    { key: 'untimeout', label: '✅ Remove Timeout', color: '#43b581', desc: 'Restore messaging' },
    { key: 'kick', label: '👢 Kick', color: '#ff6633', desc: 'Remove from session' },
    { key: 'ban', label: '🔨 Ban', color: '#f04747', desc: 'Permanently ban user' },
    { key: 'unban', label: '🔓 Unban', color: '#43b581', desc: 'Lift the ban' },
];

function AdminPanel({ members, currentUser, onClose, onAction }) {
    const [selected, setSelected] = useState(null);
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const targets = members.filter(m => m.id !== currentUser.id && m.role !== 'bot');

    const doAction = async (action) => {
        if (!selected) { setResult('Please select a user first.'); return; }
        setLoading(true);
        setResult('');
        const res = await fetch('/api/admin/moderation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, targetUserId: selected.id, adminId: currentUser.id })
        });
        const data = await res.json();
        setLoading(false);
        if (data.success) {
            setResult(`✅ ${action.charAt(0).toUpperCase() + action.slice(1)} applied to ${selected.displayName || selected.username}.`);
            onAction();
        } else {
            setResult(`❌ Error: ${data.error}`);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box admin-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🛡️ Admin Panel</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="input-group">
                        <label>Select Target User</label>
                        <div className="member-picker">
                            {targets.map(m => (
                                <div
                                    key={m.id}
                                    className={`member-pick-item ${selected?.id === m.id ? 'picked' : ''}`}
                                    onClick={() => setSelected(m)}
                                >
                                    <div className="member-avatar" style={{ background: m.bannerColor || '#5c64f2', width: 32, height: 32, fontSize: 14 }}>
                                        {(m.displayName || m.username).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{m.displayName || m.username}</div>
                                        <div style={{ fontSize: 11, color: m.moderationStatus !== 'active' ? '#f04747' : 'var(--text-muted)' }}>
                                            {m.moderationStatus}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Moderation Actions</label>
                        <div className="action-grid">
                            {ACTIONS.map(a => (
                                <button
                                    key={a.key}
                                    className="action-btn"
                                    style={{ borderColor: a.color, color: a.color }}
                                    onClick={() => doAction(a.key)}
                                    disabled={loading}
                                    title={a.desc}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {result && <div className="modal-result">{result}</div>}
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
