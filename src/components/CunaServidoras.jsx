import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Pencil, ArrowLeft, Plus, Save, X } from 'lucide-react';

import CrearTrabajadorForm from './CrearTrabajadorForm';

export default function CunaServidoras() {
    const navigate = useNavigate();
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingWorker, setEditingWorker] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editForm, setEditForm] = useState({
        nombre: '',
        apellido: '',
        correo: '',
        password: '',
        activo: true,
        rol: 'servidora',
        disponible_viernes: false,
        estado_participacion: 'activa'
    });
    const [editStatus, setEditStatus] = useState('idle');

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
            } else {
                fetchWorkers();
            }
        };
        checkSession();
    }, []);

    const fetchWorkers = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!supabase) return;
            const { data, error } = await supabase.functions.invoke('listar-trabajadores');
            if (error) throw new Error(error.message);
            setWorkers(data || []);
        } catch (err) {
            console.error('Error fetching workers:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (worker) => {
        setEditingWorker(worker);

        // Inicializar con campos separados directamente
        setEditForm({
            nombre: worker.nombre || '',
            apellido: worker.apellido || '',
            correo: worker.email || '',
            password: '', // SIEMPRE vacío al abrir
            activo: worker.activo !== false,
            rol: worker.rol || 'servidora',
            disponible_viernes: worker.disponible_viernes !== undefined ? worker.disponible_viernes : false,
            estado_participacion: worker.estado_participacion || 'activa'
        });
        setEditStatus('idle');
    };

    const handleSaveEdit = async () => {
        setEditStatus('saving');
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                throw new Error("No hay sesión activa. Por favor, recarga la página e inicia sesión nuevamente.");
            }

            const payload = {
                trabajadora_id: editingWorker.id || editingWorker.usuario_id,
                nombre: editForm.nombre,
                apellido: editForm.apellido,
                email: editForm.correo,
                activo: editForm.activo,
                rol: editForm.rol,
                disponible_viernes: editForm.disponible_viernes,
                estado_participacion: editForm.estado_participacion
            };
            if (editForm.password) payload.password = editForm.password;

            const { data, error } = await supabase.functions.invoke('admin-editar-trabajadora', {
                body: payload
            });

            if (error) throw error;
            if (data && data.error) throw new Error(data.error);

            await fetchWorkers(); // Refresco real desde BD
            setEditingWorker(null); // Cerrar modal después de refrescar

        } catch (err) {
            setEditStatus('error');
            alert(`No se pudo guardar: ${err.message || 'Error desconocido'}`);
        }
    };

    const handleDeleteWorker = async () => {
        if (!confirm("¿Estás seguro de que deseas eliminar DEFINITIVAMENTE a esta servidora? Esta acción no se puede deshacer.")) return;
        if (!confirm("Confirmación final: Esta acción borrará permanentemente todos los datos y el acceso de la usuaria. ¿Proceder?")) return;

        setEditStatus('deleting');
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) throw new Error("No hay sesión activa.");

            const { data, error } = await supabase.functions.invoke('admin-eliminar-trabajadora', {
                body: { trabajadora_id: editingWorker.id || editingWorker.usuario_id }
            });

            if (error) throw error;
            if (data && data.error) throw new Error(data.error);

            await fetchWorkers();
            setEditingWorker(null);
        } catch (err) {
            setEditStatus('error');
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        fetchWorkers();
    };

    const activeWorkers = workers.filter(w => w.activo !== false);
    const inactiveWorkers = workers.filter(w => w.activo === false);

    return (
        <div className="min-h-screen bg-[#0a192f] text-slate-200 font-sans p-8">
            <header className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Users className="text-teal-400" />
                            Gestión de Servidoras
                        </h1>
                        <p className="text-slate-400 text-sm">Administración de perfiles y accesos</p>
                    </div>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold transition-colors">
                    <Plus size={18} />
                    Nueva Servidora
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-slate-500">Cargando...</div>
                ) : (
                    <>
                        {activeWorkers.map(worker => (
                            <WorkerCard key={worker.id} worker={worker} onEdit={() => handleEditClick(worker)} />
                        ))}
                        {inactiveWorkers.length > 0 && (
                            <div className="col-span-full mt-8">
                                <h3 className="text-lg font-bold text-slate-500 mb-4 border-b border-slate-800 pb-2">Inactivas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                                    {inactiveWorkers.map(worker => (
                                        <WorkerCard key={worker.id} worker={worker} onEdit={() => handleEditClick(worker)} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODAL CREACIÓN */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-md">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute -top-12 right-0 text-slate-400 hover:text-white"
                        >
                            <X size={32} />
                        </button>
                        <CrearTrabajadorForm onSuccess={handleCreateSuccess} />
                    </div>
                </div>
            )}

            {/* MODAL EDICIÓN */}
            {editingWorker && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#112240] p-6 rounded-xl w-full max-w-lg border border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Editar Perfil</h3>
                            <button onClick={() => setEditingWorker(null)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Nombre</label>
                                    <input
                                        className="w-full bg-[#0a192f] border border-slate-600 rounded-lg p-2.5 text-white focus:border-teal-500 focus:outline-none"
                                        value={editForm.nombre}
                                        onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Apellido</label>
                                    <input
                                        className="w-full bg-[#0a192f] border border-slate-600 rounded-lg p-2.5 text-white focus:border-teal-500 focus:outline-none"
                                        value={editForm.apellido}
                                        onChange={e => setEditForm({ ...editForm, apellido: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Email (Acceso)</label>
                                <input
                                    className="w-full bg-[#0a192f] border border-slate-600 rounded-lg p-2.5 text-white focus:border-teal-500 focus:outline-none"
                                    value={editForm.correo}
                                    onChange={e => setEditForm({ ...editForm, correo: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Contraseña (Dejar vacío para mantener)</label>
                                <input
                                    type="password"
                                    className="w-full bg-[#0a192f] border border-slate-600 rounded-lg p-2.5 text-white focus:border-teal-500 focus:outline-none"
                                    value={editForm.password}
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Rol</label>
                                    <select
                                        className="w-full bg-[#0a192f] border border-slate-600 rounded-lg p-2.5 text-white focus:border-teal-500 focus:outline-none"
                                        value={editForm.rol}
                                        onChange={e => setEditForm({ ...editForm, rol: e.target.value })}
                                    >
                                        <option value="servidora">Servidora</option>
                                        <option value="responsable">Responsable</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Estado Participación</label>
                                    <select
                                        className="w-full bg-[#0a192f] border border-slate-600 rounded-lg p-2.5 text-white focus:border-teal-500 focus:outline-none"
                                        value={editForm.estado_participacion}
                                        onChange={e => setEditForm({ ...editForm, estado_participacion: e.target.value })}
                                    >
                                        <option value="activa">Activa</option>
                                        <option value="descanso">En Descanso</option>
                                        <option value="suspendida">Suspendida</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-[#0a192f] p-3 rounded-lg border border-slate-700 mt-2">
                                <input
                                    type="checkbox"
                                    id="disponibleViernes"
                                    checked={editForm.disponible_viernes}
                                    onChange={e => setEditForm({ ...editForm, disponible_viernes: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-600 text-teal-600 focus:ring-teal-500 bg-[#112240]"
                                />
                                <label htmlFor="disponibleViernes" className="text-sm text-slate-300 select-none cursor-pointer font-medium">
                                    Disponible para Viernes (⭐)
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800">
                            <button
                                onClick={handleDeleteWorker}
                                className="text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-wider hover:underline"
                            >
                                Dar de baja definitivamente
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditingWorker(null)}
                                    className="px-6 py-2.5 text-slate-400 hover:text-white font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={editStatus === 'saving'}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50 shadow-lg shadow-teal-900/20"
                                >
                                    <Save size={18} />
                                    {editStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const WorkerCard = ({ worker, onEdit }) => (
    <div className="bg-[#112240] border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-teal-500/30 transition-all group">
        <div className="relative">
            <img
                src={worker.avatar}
                alt={worker.nombre}
                className={`w-12 h-12 rounded-full bg-slate-700 ${!worker.activo && 'grayscale'}`}
            />
            {worker.disponible_viernes && (
                <span className="absolute -top-1 -right-1 text-sm drop-shadow-md" title="Disponible Viernes">⭐</span>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-100 truncate">{worker.nombre} {worker.apellido}</h3>
            <p className="text-xs text-slate-500 truncate capitalize">{worker.rol}</p>
            {worker.disponible_viernes && (
                <span className="inline-block mt-1 text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">
                    Viernes OK
                </span>
            )}
        </div>
        <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-all"
            title="Editar"
        >
            <Pencil size={18} />
        </button>
    </div>
);
