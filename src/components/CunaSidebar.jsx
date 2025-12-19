import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, FileText, MessageSquare, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function CunaSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/asignaciones', label: 'Asignaciones', icon: Calendar },
        { path: '/servidoras', label: 'Servidoras', icon: Users },
        { path: '/reportes', label: 'Reportes', icon: FileText },
        { path: '/comunicacion', label: 'Comunicación', icon: MessageSquare },
    ];

    return (
        <div className="w-64 bg-[#112240] border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-40">
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-2xl font-bold text-teal-400 tracking-wider">CUNA</h2>
                <p className="text-xs text-slate-500 mt-1">Administración</p>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${active
                                    ? 'bg-teal-600/10 text-teal-400 border border-teal-600/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                        >
                            <Icon size={20} className={active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
}
