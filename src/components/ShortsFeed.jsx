import { useState, useEffect } from 'react';

function ShortsFeed({ currentUser }) {
    const [shorts, setShorts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        fetch(`/api/shorts?userId=${currentUser.id}`)
            .then(r => r.json())
            .then(data => setShorts(data))
            .catch(console.error);
    }, [currentUser.id]);

    const handleRate = async (short, isLike) => {
        // Toggle logic
        const newState = short.userInteraction === isLike ? null : isLike;
        const res = await fetch(`/api/shorts/${short.id}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, isLike: newState })
        });
        const data = await res.json();
        if (data.success) {
            setShorts(prev => prev.map(s => {
                if (s.id !== short.id) return s;
                let newLikes = s.likes;
                let newDislikes = s.dislikes;
                // remove old state
                if (s.userInteraction === 1) newLikes--;
                if (s.userInteraction === 0) newDislikes--;
                // add new state
                if (newState === 1) newLikes++;
                if (newState === 0) newDislikes++;
                return { ...s, userInteraction: newState, likes: newLikes, dislikes: newDislikes };
            }));
        }
    };

    const loadComments = (shortId) => {
        fetch(`/api/shorts/${shortId}/comments`)
            .then(r => r.json())
            .then(setComments);
        setShowComments(true);
    };

    const handlePostComment = async (e, shortId) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        const res = await fetch(`/api/shorts/${shortId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, content: newComment })
        });
        const data = await res.json();
        if (data.success) {
            setComments(prev => [data.comment, ...prev]);
            setNewComment('');
            setShorts(prev => prev.map(s => s.id === shortId ? { ...s, commentsCount: s.commentsCount + 1 } : s));
        }
    };

    const handlePostShort = async () => {
        const url = prompt('Enter a YouTube Shorts URL:');
        if (!url) return;
        const title = prompt('Enter a title/caption:');
        const res = await fetch('/api/shorts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, uploaderId: currentUser.id, title })
        });
        const data = await res.json();
        if (data.success) {
            alert('Posted! It will appear when you reload the feed.');
            // Refresh feed
            fetch(`/api/shorts?userId=${currentUser.id}`).then(r => r.json()).then(setShorts);
        } else {
            alert('Error: ' + data.error);
        }
    };

    if (shorts.length === 0) {
        return (
            <div className="shorts-container empty">
                <h2>No Shorts to watch!</h2>
                <button className="btn-primary" onClick={handlePostShort} style={{ marginTop: 20 }}>
                    Post the first YouTube Short
                </button>
            </div>
        );
    }

    const currentShort = shorts[currentIndex];

    return (
        <div className="shorts-container">
            <div className="shorts-header">
                <h2>▶️ Media Shorts</h2>
                <button className="btn-primary" onClick={handlePostShort} style={{ padding: '8px 16px' }}>＋ Post Short</button>
            </div>

            <div className="shorts-feed-wrapper">
                <div className="shorts-video-area">
                    {/* YouTube Embed */}
                    <div className="video-player">
                        <iframe
                            src={`https://www.youtube.com/embed/${currentShort.youtubeId}?autoplay=1&loop=1&playlist=${currentShort.youtubeId}&controls=0`}
                            title={currentShort.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ width: '100%', height: '100%', borderRadius: '12px' }}
                        />
                    </div>

                    <div className="shorts-overlay-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div className="member-avatar" style={{ background: currentShort.bannerColor || '#5c64f2' }}>
                                {currentShort.pfpUrl ? <img src={currentShort.pfpUrl} alt="pfp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : currentShort.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                {currentShort.displayName}
                            </div>
                        </div>
                        <div style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontSize: 14 }}>
                            {currentShort.title}
                        </div>
                    </div>

                    <div className="shorts-action-bar">
                        <div className={`action-item ${currentShort.userInteraction === 1 ? 'active-like' : ''}`} onClick={() => handleRate(currentShort, 1)}>
                            <i className='bx bxs-upvote sidebar-icon' style={{ fontSize: 28 }}></i>
                            <span>{currentShort.likes}</span>
                        </div>
                        <div className={`action-item ${currentShort.userInteraction === 0 ? 'active-dislike' : ''}`} onClick={() => handleRate(currentShort, 0)}>
                            <i className='bx bxs-downvote sidebar-icon' style={{ fontSize: 28 }}></i>
                            <span>{currentShort.dislikes}</span>
                        </div>
                        <div className="action-item" onClick={() => loadComments(currentShort.id)}>
                            <i className='bx bxs-message-rounded-dots sidebar-icon' style={{ fontSize: 28 }}></i>
                            <span>{currentShort.commentsCount}</span>
                        </div>
                    </div>
                </div>

                <div className="shorts-nav-controls">
                    <button
                        className="nav-btn"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(c => c - 1)}
                    >
                        <i className='bx bx-chevron-up' style={{ fontSize: 32 }}></i>
                    </button>
                    <button
                        className="nav-btn"
                        disabled={currentIndex === shorts.length - 1}
                        onClick={() => setCurrentIndex(c => c + 1)}
                    >
                        <i className='bx bx-chevron-down' style={{ fontSize: 32 }}></i>
                    </button>
                </div>
            </div>

            {/* Comments Side Panel */}
            {showComments && (
                <div className="comments-panel">
                    <div className="comments-header">
                        <h3>Comments ({currentShort.commentsCount})</h3>
                        <button className="modal-close" onClick={() => setShowComments(false)}>✕</button>
                    </div>

                    <div className="comments-list">
                        {comments.map(c => (
                            <div key={c.id} className="comment-item">
                                <div className="member-avatar" style={{ width: 24, height: 24, background: c.bannerColor || '#5c64f2', fontSize: 12 }}>
                                    {c.pfpUrl ? <img src={c.pfpUrl} alt="pfp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{c.displayName} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(c.timestamp).toLocaleDateString()}</span></div>
                                    <div style={{ fontSize: 14 }}>{c.content}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form className="comment-input-form" onSubmit={(e) => handlePostComment(e, currentShort.id)}>
                        <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                        />
                        <button type="submit" className="send-btn" style={{ padding: '6px 12px' }}>➤</button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default ShortsFeed;
