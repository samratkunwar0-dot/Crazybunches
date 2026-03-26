import { useState } from 'react';

function ProfileSettings({ currentUser, onUpdate, onClose }) {
    const [displayName, setDisplayName] = useState(currentUser.displayName || currentUser.username);
    const [bannerColor, setBannerColor] = useState(currentUser.bannerColor || '#5c64f2');
    const [pfpUrl, setPfpUrl] = useState(currentUser.pfpUrl || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/user/${currentUser.id}/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName, bannerColor, pfpUrl })
            });
            const data = await res.json();
            if (data.success) {
                onUpdate(data.user);
            } else {
                setError(data.error || 'Update failed');
            }
        } catch {
            setError('Server error');
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Banner Preview */}
                <div className="profile-banner-preview" style={{ background: bannerColor }}>
                    <div className="profile-avatar-preview" style={{ background: bannerColor, border: '4px solid var(--bg-primary)' }}>
                        {pfpUrl
                            ? <img src={pfpUrl} alt="pfp" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : displayName.charAt(0).toUpperCase()
                        }
                    </div>
                </div>

                <div className="modal-body">
                    {error && <div className="modal-error">{error}</div>}

                    <div className="input-group">
                        <label>Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="Your display name"
                        />
                    </div>

                    <div className="input-group">
                        <label>Profile Picture URL</label>
                        <input
                            type="text"
                            value={pfpUrl}
                            onChange={e => setPfpUrl(e.target.value)}
                            placeholder="https://example.com/image.png"
                        />
                    </div>

                    <div className="input-group">
                        <label>Banner / Accent Color</label>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input
                                type="color"
                                value={bannerColor}
                                onChange={e => setBannerColor(e.target.value)}
                                style={{ width: 48, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }}
                            />
                            <input
                                type="text"
                                value={bannerColor}
                                onChange={e => setBannerColor(e.target.value)}
                                style={{ flex: 1 }}
                                placeholder="#5c64f2"
                            />
                        </div>
                        <div className="color-presets">
                            {['#5c64f2', '#ff4444', '#44ff88', '#ffaa00', '#ff44ff', '#00ccff', '#ff6633', '#9b59b6'].map(c => (
                                <div
                                    key={c}
                                    className="color-swatch"
                                    style={{ background: c, outline: bannerColor === c ? '3px solid white' : 'none' }}
                                    onClick={() => setBannerColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <button className="btn-primary" onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProfileSettings;
