import React from 'react';
import { Outlet } from 'react-router-dom';
import CunaSidebar from './CunaSidebar';

export default function AdminLayout() {
    return (
        <div className="flex min-h-screen bg-[#0a192f]">
            <CunaSidebar />
            <main className="flex-1 ml-64 min-h-screen">
                <Outlet />
            </main>
        </div>
    );
}
