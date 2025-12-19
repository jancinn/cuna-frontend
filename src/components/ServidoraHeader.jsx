import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function ServidoraHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const isDashboard = location.pathname === '/servidora';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#112240] text-white flex items-center justify-between px-4 z-50 shadow-md md:hidden">
            <div className="flex items-center gap-3">
                {!isDashboard && (
                    <button
                        onClick={() => navigate('/servidora')}
                        className="p-2 -ml-2 text-slate-300 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                )}
                <h1 className="text-lg font-bold tracking-wide">CUNA</h1>
            </div>

            {isDashboard && (
                <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-white"
                >
                    <LogOut size={20} />
                </button>
            )}
        </header>
    );
}
