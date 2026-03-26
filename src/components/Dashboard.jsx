import { useState, useEffect } from 'react';
import HouseBar from './HouseBar';
import CornerList from './CornerList';
import ChatArea from './ChatArea';
import MemberList from './MemberList';
import ProfileSettings from './ProfileSettings';
import AdminPanel from './AdminPanel';
import ShortsFeed from './ShortsFeed';

function Dashboard({ currentUser, onLogout, onProfileUpdate, socket }) {
    const [houses, setHouses] = useState([]);
    const [activeHouse, setActiveHouse] = useState(null);
    const [corners, setCorners] = useState([]);
    const [members, setMembers] = useState([]);
    const [activeCorner, setActiveCorner] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showingFeed, setShowingFeed] = useState(false);

    // Fetch all houses on load
    useEffect(() => {
        fetch('/api/houses')
            .then(r => r.json())
            .then(data => {
                setHouses(data);
                if (data.length > 0) setActiveHouse(data[0]);
            })
            .catch(console.error);
    }, []);

    // Whenever active house changes, fetch its corners and members
    useEffect(() => {
        if (!activeHouse) return;
        fetch(`/api/houses/${activeHouse.id}/corners`)
            .then(r => r.json())
            .then(data => {
                setCorners(data);
                if (data.length > 0) setActiveCorner(data[0]);
            })
            .catch(console.error);

        fetch(`/api/houses/${activeHouse.id}/members`)
            .then(r => r.json())
            .then(setMembers)
            .catch(console.error);
    }, [activeHouse]);

    // Listen for moderation events
    useEffect(() => {
        const handler = ({ action, targetUserId }) => {
            if (targetUserId === currentUser.id) {
                alert(`You have been ${action}ed by an admin.`);
                if (action === 'kick' || action === 'ban') onLogout();
            }
        };
        socket.on('moderation_action', handler);
        return () => socket.off('moderation_action', handler);
    }, [socket, currentUser, onLogout]);

    const handleCreateHouse = async () => {
        const name = prompt('Enter house name:');
        if (!name) return;
        const icon = prompt('Enter a Boxicon class (e.g., bx-home, bx-game, bx-code-alt):', 'bx-home');
        const res = await fetch('/api/houses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, iconUrl: icon || 'bx-home', ownerId: currentUser.id })
        });
        const data = await res.json();
        if (data.success) setHouses(h => [...h, data.house]);
    };

    const handleCreateCorner = async () => {
        if (!activeHouse) return;
        const name = prompt('Enter corner name:');
        if (!name) return;
        const res = await fetch(`/api/houses/${activeHouse.id}/corners`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) setCorners(c => [...c, data.corner]);
    };

    return (
        <div className="app-layout">
            <HouseBar
                houses={houses}
                activeHouse={activeHouse}
                onSelectHouse={(h) => { setActiveHouse(h); setShowingFeed(false); }}
                onCreateHouse={handleCreateHouse}
                showingFeed={showingFeed}
                onToggleFeed={() => setShowingFeed(true)}
            />

            {showingFeed ? (
                <div style={{ flex: 1, display: 'flex', background: 'var(--bg-primary)' }}>
                    <ShortsFeed currentUser={currentUser} />
                </div>
            ) : (
                <>
                    <CornerList
                        activeHouse={activeHouse}
                        corners={corners}
                        activeCorner={activeCorner}
                        onSelectCorner={setActiveCorner}
                        onCreateCorner={handleCreateCorner}
                        currentUser={currentUser}
                        onLogout={onLogout}
                        onProfileClick={() => setShowProfile(true)}
                        onAdminClick={() => setShowAdmin(true)}
                    />
                    <ChatArea
                        activeCorner={activeCorner}
                        currentUser={currentUser}
                        socket={socket}
                    />
                    <MemberList members={members} />
                </>
            )}

            {showProfile && (
                <ProfileSettings
                    currentUser={currentUser}
                    onUpdate={(u) => { onProfileUpdate(u); setShowProfile(false); }}
                    onClose={() => setShowProfile(false)}
                />
            )}
            {showAdmin && currentUser.role === 'admin' && (
                <AdminPanel
                    members={members}
                    currentUser={currentUser}
                    onClose={() => setShowAdmin(false)}
                    onAction={() => fetch(`/api/houses/${activeHouse?.id}/members`).then(r => r.json()).then(setMembers)}
                />
            )}
        </div>
    );
}

export default Dashboard;
