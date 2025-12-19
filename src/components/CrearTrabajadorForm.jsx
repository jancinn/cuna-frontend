import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserPlus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function CrearTrabajadorForm({ onSuccess }) {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        activo: true,
        disponible_viernes: true
    });

    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            if (!supabase) throw new Error('Cliente Supabase no inicializado');

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error("No hay sesión activa. Por favor, recarga la página e inicia sesión nuevamente.");
            }

            const { data, error } = await supabase.functions.invoke('crear-trabajador', {
                body: {
                    nombre: `${formData.nombre} ${formData.apellido}`.trim(), // Concatenado para compatibilidad
                    nombre_real: formData.nombre, // Separado para nuevas columnas
                    apellido_real: formData.apellido, // Separado para nuevas columnas
                    email: formData.email,
                    password: formData.password,
                    rol: formData.rol || 'servidora',
                    disponible_viernes: formData.disponible_viernes
                },
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) {
                throw new Error(error.message || 'Error al invocar la función');
            }

            // Manejo de respuesta 200 con error lógico (success: false)
            if (data && data.success === false) {
                throw new Error(data.error || 'Error desconocido al crear trabajador');
            }

            // Compatibilidad legacy: si no viene success pero viene error
            if (data && data.error) {
                throw new Error(data.error);
            }

            setStatus('success');
            setMessage('Trabajador creado exitosamente');
            setFormData({ nombre: '', apellido: '', email: '', password: '', activo: true, disponible_viernes: true });

            if (onSuccess) onSuccess();

            // Resetear mensaje de éxito después de 3 segundos
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 3000);

        } catch (err) {
            console.error('Error creando trabajador:', err);
            setStatus('error');
            setMessage(err.message || 'Ocurrió un error inesperado');
        }
    };

    return (
        <div className="bg-[#112240] p-6 rounded-lg border border-slate-700 shadow-lg max-w-md w-full">
            <div className="flex items-center gap-2 mb-6 text-teal-400">
                <UserPlus size={24} />
                <h2 className="text-xl font-bold">Alta de Trabajador</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre y Apellido */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                            className="w-full p-2 rounded bg-[#0a192f] border border-slate-600 text-white focus:border-teal-500 focus:outline-none"
                            placeholder="Ej. María"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Apellido</label>
                        <input
                            type="text"
                            name="apellido"
                            value={formData.apellido}
                            onChange={handleChange}
                            required
                            className="w-full p-2 rounded bg-[#0a192f] border border-slate-600 text-white focus:border-teal-500 focus:outline-none"
                            placeholder="Ej. Pérez"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-[#0a192f] border border-slate-600 text-white focus:border-teal-500 focus:outline-none"
                        placeholder="usuario@ejemplo.com"
                    />
                </div>

                {/* Contraseña Inicial */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña Inicial</label>
                    <input
                        type="text" // Visible intencionalmente para que el admin la copie/verifique
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="w-full p-2 rounded bg-[#0a192f] border border-slate-600 text-white focus:border-teal-500 focus:outline-none font-mono"
                        placeholder="Mínimo 6 caracteres"
                    />
                    <p className="text-xs text-slate-500 mt-1">Comparte esta contraseña con el trabajador.</p>
                </div>

                {/* Rol */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Rol</label>
                    <select
                        name="rol"
                        value={formData.rol || 'servidora'}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-[#0a192f] border border-slate-600 text-white focus:border-teal-500 focus:outline-none"
                    >
                        <option value="servidora">Servidora</option>
                        <option value="responsable">Responsable (Admin)</option>
                    </select>
                </div>

                {/* Activo (Visualmente presente, aunque la función lo fuerza a true por ahora) */}
                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        name="activo"
                        id="activo"
                        checked={formData.activo}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-slate-600 bg-[#0a192f] text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="activo" className="text-sm text-slate-300 cursor-pointer">
                        Cuenta activa inmediatamente
                    </label>
                </div>

                {/* Disponible Viernes */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="disponible_viernes"
                        id="disponible_viernes"
                        checked={formData.disponible_viernes}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-slate-600 bg-[#0a192f] text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="disponible_viernes" className="text-sm text-slate-300 cursor-pointer">
                        Disponible para Viernes
                    </label>
                </div>

                {/* Mensajes de Estado */}
                {status === 'error' && (
                    <div className="p-3 bg-red-500/20 border border-red-500 rounded flex items-center gap-2 text-red-200 text-sm">
                        <AlertCircle size={16} />
                        <span>{message}</span>
                    </div>
                )}

                {status === 'success' && (
                    <div className="p-3 bg-teal-500/20 border border-teal-500 rounded flex items-center gap-2 text-teal-200 text-sm">
                        <CheckCircle size={16} />
                        <span>{message}</span>
                    </div>
                )}

                {/* Botón Submit */}
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed rounded font-bold text-white transition-colors flex items-center justify-center gap-2 mt-4"
                >
                    {status === 'loading' ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Creando...
                        </>
                    ) : (
                        'Crear Trabajador'
                    )}
                </button>
            </form>
        </div>
    );
}
