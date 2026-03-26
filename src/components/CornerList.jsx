function CornerList({ activeHouse, corners, activeCorner, onSelectCorner, onCreateCorner, currentUser, onLogout, onProfileClick, onAdminClick }) {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <span>{activeHouse?.iconUrl} {activeHouse?.name || 'Select a House'}</span>
            </div>

            <div className="channel-section-label">CORNERS</div>
            <div className="channel-list">
                {corners.map(corner => (
                    <div
                        key={corner.id}
                        className={`channel-item ${corner.id === activeCorner?.id ? 'active' : ''}`}
                        onClick={() => onSelectCorner(corner)}
                    >
                        <span className="hash">#</span>
                        {corner.name}
                    </div>
                ))}
                <div className="channel-item add-channel" onClick={onCreateCorner}>
                    <span className="hash">＋</span>
                    Add Corner
                </div>
            </div>

            <div className="user-panel">
                <div
                    className="member-avatar"
                    style={{ background: currentUser.bannerColor || '#5c64f2', cursor: 'pointer' }}
                    onClick={onProfileClick}
                    title="Edit Profile"
                >
                    {currentUser.pfpUrl
                        ? <img src={currentUser.pfpUrl} alt="pfp" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        : (currentUser.displayName || currentUser.username).charAt(0).toUpperCase()
                    }
                    <div className="status-indicator" />
                </div>
                <div className="user-panel-info">
                    <div className="user-panel-name">{currentUser.displayName || currentUser.username}</div>
                    <div className="user-panel-status">
                        {currentUser.role === 'admin' ? '⚡ Admin' : 'Online'}
                    </div>
                </div>
                <div className="user-panel-actions">
                    {currentUser.role === 'admin' && (
                        <button className="panel-icon-btn" onClick={onAdminClick} title="Admin Panel">🛡️</button>
                    )}
                    <button className="panel-icon-btn" onClick={onProfileClick} title="Profile Settings">⚙️</button>
                    <button className="panel-icon-btn" onClick={onLogout} title="Log Out">✕</button>
                </div>
            </div>
        </div>
    );
}

export default CornerList;
