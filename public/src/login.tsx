import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/auth/Login';

// Protected Route component
interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    // Check if user is authenticated by looking for token
    const isAuthenticated = !!localStorage.getItem('authToken');
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // If authenticated, render the protected content
    return <>{children}</>;
};

// Main App component
const App: React.FC = () => {
    return (
        <Router>
            {/* Wrap entire app with AuthProvider */}
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* Protected routes */}
                    <Route path="/chat" element={
                        <ProtectedRoute>
                            <div>Chat Page (to be implemented)</div>
                        </ProtectedRoute>
                    } />
                    
                    {/* Default route - redirect to login */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    
                    {/* Catch all route for 404s */}
                    <Route path="*" element={
                        <div>
                            <h1>404 - Page Not Found</h1>
                            <p>The page you're looking for doesn't exist.</p>
                        </div>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App; 