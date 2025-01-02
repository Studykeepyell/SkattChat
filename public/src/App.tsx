import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/auth/Login';  // Import from new location

// Protected Route component
interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return <>{children}</>;
};

// Main App component
const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/chat" element={
                        <ProtectedRoute>
                            <div>Chat Page (to be implemented)</div>
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    
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