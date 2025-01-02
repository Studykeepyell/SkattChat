import React from 'react';
import { Taskbar } from './Taskbar';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="container">
            <Taskbar />
            <main className="content">
                {children}
            </main>
        </div>
    );
};

export default MainLayout; 