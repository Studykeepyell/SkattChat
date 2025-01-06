import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of our user object
interface User {
    id: string;
    username: string;
}

// Define what data and functions will be available through the context
interface AuthContextType {
    user: User | null;        // Current user data
    token: string | null;     // Authentication token
    login: (username: string, password: string) => Promise<void>;  // Login function
    logout: () => void;       // Logout function
    isAuthenticated: boolean; // Whether user is logged in
}

// Create the context with a default value of null
export const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Props type for the AuthProvider component
interface AuthProviderProps {
    children: ReactNode;  // ReactNode type allows any valid React children
}

// AuthProvider component that will wrap our app
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // State to store user data and token
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // Login function
    const login = async (username: string, password: string) => {
        try {
            // Determine the base URL based on the environment
            const baseURL = window.location.hostname === 'localhost' 
                ? 'http://localhost:3000' 
                : 'https://skattchat.online';

            // Make the login request
            const response = await fetch(`${baseURL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            // If response is not ok, throw an error
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            // Parse the response data
            const data = await response.json();

            // If login was successful
            if (data.success) {
                // Create user object
                const userData: User = {
                    id: data.userId,
                    username: username
                };

                // Update state with user data and token
                setUser(userData);
                setToken(data.token);

                // Store data in localStorage for persistence
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('username', username);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error; // Re-throw to handle in the component
        }
    };

    // Logout function
    const logout = () => {
        // Clear state
        setUser(null);
        setToken(null);

        // Clear localStorage
        localStorage.removeItem('userId');
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
    };

    // Check if user is authenticated
    const isAuthenticated = !!user && !!token;

    // Create the context value object
    const contextValue: AuthContextType = {
        user,
        token,
        login,
        logout,
        isAuthenticated
    };

    // Provide the context value to children components
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}; 