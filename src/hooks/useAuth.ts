import { useState, useCallback } from 'react';

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const login = useCallback(async (username: string, password: string) => {
        // Move your login logic here
    }, []);

    const logout = useCallback(() => {
        // Move your logout logic here
    }, []);

    return { isAuthenticated, login, logout };
}; 