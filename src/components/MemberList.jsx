function MemberList({ members }) {
    const admins = members.filter(u => u.role === 'admin');
    const bots = members.filter(u => u.role === 'bot');
    const users = members.filter(u => u.role === 'user');

    const renderMember = (user) => (
        <div key={user.id} className={`member-item ${user.moderationStatus !== 'active' ? 'muted-member' : ''}`}>
            <div className="member-avatar" style={{ background: user.bannerColor || '#5c64f2' }}>
                {user.pfpUrl
                    ? <img src={user.pfpUrl} alt="pfp" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : (user.displayName || user.username).charAt(0).toUpperCase()
                }
                <div className="status-indicator" style={{ background: user.moderationStatus !== 'active' ? '#f04747' : '#43b581' }} />
            </div>
            <div>
                <div className={`member-name ${user.hasNitro ? 'nitro-badge' : ''}`}>
                    {user.displayName || user.username}
                </div>
                {user.moderationStatus !== 'active' && (
                    <div style={{ fontSize: 10, color: '#f04747', textTransform: 'uppercase' }}>{user.moderationStatus}</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="member-list-wrapper">
            {admins.length > 0 && <>
                <div className="member-list-header">ADMINS — {admins.length}</div>
                {admins.map(renderMember)}
            </>}
            {users.length > 0 && <>
                <div className="member-list-header" style={{ marginTop: 16 }}>MEMBERS — {users.length}</div>
                {users.map(renderMember)}
            </>}
            {bots.length > 0 && <>
                <div className="member-list-header" style={{ marginTop: 16 }}>BOTS — {bots.length}</div>
                {bots.map(renderMember)}
            </>}
        </div>
    );
}

export default MemberList;
