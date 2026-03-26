import { useState } from 'react';
import { io } from 'socket.io-client';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export const socket = io('/', { autoConnect: false });

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    socket.connect();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    socket.disconnect();
  };

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  return (
    <div className="app-container">
      {!currentUser ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onProfileUpdate={handleProfileUpdate}
          socket={socket}
        />
      )}
    </div>
  );
}

export default App;
