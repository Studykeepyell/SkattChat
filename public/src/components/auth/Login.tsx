import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Login component
const Login: React.FC = () => {
    // State for form inputs
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Get navigation function from react-router
    const navigate = useNavigate();
    
    // Get auth functions from context
    const { login } = useAuth();

    // Handle form submission
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default form submission
        setError(null);    // Clear any previous errors
        setIsLoading(true); // Start loading state

        try {
            // Validate inputs
            if (!username.trim() || !password.trim()) {
                throw new Error('Please enter both username and password');
            }

            // Attempt to login
            await login(username, password);

            // If successful, redirect to chat page
            navigate('/chat');
        } catch (error) {
            // Handle login errors
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false); // End loading state
        }
    };

    return (
        <div className="login-container">
            <h1>Login to SkyChat</h1>
            
            <form onSubmit={handleSubmit} className="login-form">
                {/* Username input */}
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        disabled={isLoading}
                        required
                    />
                </div>

                {/* Password input */}
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={isLoading}
                        required
                    />
                </div>

                {/* Error message display */}
                {error && (
                    <div className="error-message" role="alert">
                        {error}
                    </div>
                )}

                {/* Submit button */}
                <button 
                    type="submit" 
                    className="login-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>

                {/* Register link */}
                <p className="register-link">
                    Don't have an account?{' '}
                    <a href="/register" onClick={(e) => {
                        e.preventDefault();
                        navigate('/register');
                    }}>
                        Register here
                    </a>
                </p>
            </form>o
        </div>
    );
};

export default Login; 