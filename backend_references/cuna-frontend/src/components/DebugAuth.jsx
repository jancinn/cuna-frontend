import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function DebugAuth() {
    const [user, setUser] = useState(null);
    const [roleData, setRoleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            // 1. Obtener usuario autenticado
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate('/login');
                return;
            }

            setUser(user);

            // 2. Consultar rol en cuna_trabajadores
            const { data, error } = await supabase
                .from('cuna_trabajadores')
                .select('rol, activo')
                .eq('usuario_id', user.id)
                .single();

            if (error) {
                console.error('Error fetching role:', error);
            } else {
                setRoleData(data);
            }

            setLoading(false);
        };

        checkUser();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (loading) return <div className="p-10 text-white">Cargando perfil...</div>;

    return (
        <div className="min-h-screen bg-[#0a192f] text-white p-8 flex flex-col items-center">
            <div className="max-w-lg w-full bg-[#112240] p-6 rounded-lg border border-slate-700">
                <h1 className="text-xl font-bold text-teal-400 mb-4">Debug Auth Status</h1>

                <div className="space-y-4">
                    <div className="p-3 bg-slate-800 rounded">
                        <p className="text-xs text-slate-400 uppercase">Email Usuario</p>
                        <p className="font-mono text-lg">{user?.email}</p>
                        <p className="text-xs text-slate-500 mt-1">ID: {user?.id}</p>
                    </div>

                    <div className="p-3 bg-slate-800 rounded">
                        <p className="text-xs text-slate-400 uppercase">Rol en Cuna</p>
                        {roleData ? (
                            <>
                                <p className="font-bold text-xl text-teal-300 uppercase">{roleData.rol}</p>
                                <p className="text-sm text-slate-400">Activo: {roleData.activo ? 'Sí' : 'No'}</p>
                            </>
                        ) : (
                            <p className="text-red-400">No encontrado en cuna_trabajadores</p>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full py-2 border border-red-500 text-red-400 hover:bg-red-500/10 rounded"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
