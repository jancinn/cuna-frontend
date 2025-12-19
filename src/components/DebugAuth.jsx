import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function DebugAuth() {
    const [user, setUser] = useState(null);
    const [roleData, setRoleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            if (!supabase) {
                console.error('Supabase no inicializado');
                return;
            }
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
                setErrorMsg(error.message || JSON.stringify(error));
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
                            <div className="text-red-400">
                                <p className="font-bold">No encontrado en cuna_trabajadores</p>
                                {errorMsg && <p className="text-xs mt-2 p-2 bg-red-900/30 rounded font-mono break-all">{errorMsg}</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {roleData?.rol === 'responsable' && (
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold"
                            >
                                Ir al Dashboard
                            </button>
                        )}
                        {roleData?.rol === 'servidora' && (
                            <button
                                onClick={() => navigate('/servidora')}
                                className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold"
                            >
                                Ir a Vista Servidora
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex-1 py-2 border border-red-500 text-red-400 hover:bg-red-500/10 rounded"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div >
        </div >
    );
}
