function ChannelList({ channels, activeChannelId, onSelectChannel, currentUser, onLogout }) {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                Discord Clone
            </div>

            <div className="channel-list">
                {channels.map((channel) => (
                    <div
                        key={channel.id}
                        className={`channel-item ${channel.id === activeChannelId ? 'active' : ''}`}
                        onClick={() => onSelectChannel(channel.id)}
                    >
                        <span className="hash">#</span>
                        {channel.name}
                    </div>
                ))}
            </div>

            <div className="user-panel">
                <div className="member-avatar">
                    {currentUser.username.charAt(0)}
                    <div className="status-indicator"></div>
                </div>
                <div className="user-panel-info">
                    <div className="user-panel-name">{currentUser.username}</div>
                    <div className="user-panel-status">Online</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button
                        onClick={onLogout}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                        title="Log out"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChannelList;
