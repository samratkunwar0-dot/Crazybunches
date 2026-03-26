import { useState } from 'react';

function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        const endpoint = isRegistering ? '/api/register' : '/api/login';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (data.success) {
                if (isRegistering) {
                    setSuccessMsg('Registration successful! You can now log in.');
                    setIsRegistering(false);
                    setPassword(''); // Clear password for security
                } else {
                    onLogin(data.user);
                }
            } else {
                setError(data.error || (isRegistering ? 'Registration failed' : 'Login failed'));
            }
        } catch (err) {
            setError('Server error. Is the backend running?');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>{isRegistering ? 'Create an account' : 'Welcome back!'}</h1>
                <p>{isRegistering ? 'Join the community today!' : "We're so excited to see you again!"}</p>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div style={{ color: 'var(--accent-red)', fontSize: '14px', marginBottom: '8px' }}>{error}</div>}
                    {successMsg && <div style={{ color: '#43b581', fontSize: '14px', marginBottom: '8px' }}>{successMsg}</div>}

                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="e.g. chhewang"
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="*************"
                        />
                    </div>

                    <button type="submit" className="btn-primary">
                        {isRegistering ? 'Register' : 'Log In'}
                    </button>

                    <div className="register-text" style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
                        {isRegistering ? 'Already have an account?' : "Need an account?"}{' '}
                        <span
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                                setSuccessMsg('');
                            }}
                            style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}
                        >
                            {isRegistering ? 'Log In' : 'Register'}
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
