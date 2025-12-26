import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

import ServidoraHeader from './ServidoraHeader';

export default function CunaIntercambiosServidora() {
    const [loading, setLoading] = useState(true);
    const [myShifts, setMyShifts] = useState([]);
    const [availableShifts, setAvailableShifts] = useState([]);
    const [draggedShift, setDraggedShift] = useState(null);
    const [dropZoneActive, setDropZoneActive] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await Promise.all([
                fetchMyShifts(user),
                fetchAvailableShifts(user)
            ]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyShifts = async (user) => {
        const today = new Date().toISOString().split('T')[0];

        // Fetch turnos futuros
        const { data, error } = await supabase
            .from('cuna_turnos')
            .select(`
                id,
                slot_numero,
                estado,
                cuna_calendario (
                    id,
                    fecha,
                    dia_semana
                )
            `)
            .eq('trabajador_id', user.id)
            .neq('estado', 'liberado') // Solo asignados o solicitados
            .gte('cuna_calendario.fecha', today)
            .order('cuna_calendario(fecha)', { ascending: true });

        if (error) throw error;

        // Aplanar estructura
        const shifts = data
            .filter(t => t.cuna_calendario) // Filtrar huérfanos
            .map(t => ({
                id: t.id,
                fecha: t.cuna_calendario.fecha,
                dia_semana: t.cuna_calendario.dia_semana,
                slot: t.slot_numero,
                estado: t.estado
            }));

        setMyShifts(shifts);
    };

    const fetchAvailableShifts = async (user) => {
        const today = new Date().toISOString().split('T')[0];

        // Fetch turnos en solicitud de cambio de OTROS usuarios
        const { data, error } = await supabase
            .from('cuna_turnos')
            .select(`
                id,
                slot_numero,
                estado,
                trabajador_id,
                cuna_calendario (
                    id,
                    fecha,
                    dia_semana
                )
            `)
            .eq('estado', 'solicitud_cambio')
            .neq('trabajador_id', user.id) // No mis propios turnos
            .gte('cuna_calendario.fecha', today)
            .order('cuna_calendario(fecha)', { ascending: true });

        if (error) throw error;

        // Obtener nombres de trabajadores para mostrar quién solicita
        // (Optimización: Podríamos hacer un join si la relación existiera, o fetch separado)
        // Por simplicidad ahora, mostraremos "Compañera" si no tenemos el nombre

        const shifts = data
            .filter(t => t.cuna_calendario)
            .map(t => ({
                id: t.id,
                fecha: t.cuna_calendario.fecha,
                dia_semana: t.cuna_calendario.dia_semana,
                slot: t.slot_numero,
                estado: t.estado,
                originalWorkerId: t.trabajador_id
            }));

        setAvailableShifts(shifts);
    };

    const handleDragStart = (e, shift) => {
        if (shift.estado === 'solicitud_cambio') {
            e.preventDefault(); // No permitir arrastrar si ya está en solicitud
            return;
        }
        setDraggedShift(shift);
        e.dataTransfer.setData('text/plain', shift.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDropZoneActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDropZoneActive(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setDropZoneActive(false);
        const shiftId = e.dataTransfer.getData('text/plain');

        if (shiftId && draggedShift && draggedShift.id === shiftId) {
            if (confirm(`¿Confirmas que deseas exponer la fecha ${draggedShift.fecha} para intercambio?`)) {
                await exposeShift(shiftId);
            }
        }
        setDraggedShift(null);
    };

    const exposeShift = async (shiftId) => {
        try {
            const { error } = await supabase
                .from('cuna_turnos')
                .update({ estado: 'solicitud_cambio' })
                .eq('id', shiftId);

            if (error) throw error;

            // Actualizar localmente
            setMyShifts(prev => prev.map(s =>
                s.id === shiftId ? { ...s, estado: 'solicitud_cambio' } : s
            ));

            alert('Fecha expuesta correctamente. Ahora es visible para otras compañeras.');
        } catch (err) {
            alert('Error al exponer fecha: ' + err.message);
        }
    };

    const handleTakeShift = async (shift) => {
        if (!confirm(`¿Confirmas que deseas tomar el turno del ${shift.fecha}?`)) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Actualizar turno: asignarlo a mí y cambiar estado a asignado
            const { error } = await supabase
                .from('cuna_turnos')
                .update({
                    estado: 'asignado',
                    trabajador_id: user.id
                })
                .eq('id', shift.id);

            if (error) throw error;

            alert('¡Turno tomado con éxito! Gracias por tu apoyo.');
            fetchData(); // Recargar todo
        } catch (err) {
            alert('Error al tomar el turno: ' + err.message);
        }
    };

    if (loading) return <div className="p-8 text-slate-400">Cargando turnos...</div>;

    return (
        <div className="p-4 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto font-sans text-slate-200 bg-[#0a192f] min-h-screen">
            <ServidoraHeader />
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <RefreshCw className="text-teal-400" />
                    Gestión de Intercambios
                </h1>
                <p className="text-slate-400 mt-1">Arrastra tus turnos a la canasta para solicitar un cambio.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* COLUMNA IZQUIERDA: MIS TURNOS */}
                <div className="space-y-4">
                    <h2 className="font-bold text-slate-300 flex items-center gap-2">
                        <Calendar size={20} />
                        Mis Fechas Asignadas
                    </h2>

                    <div className="space-y-3">
                        {myShifts.length > 0 ? (
                            myShifts.map(shift => (
                                <div
                                    key={shift.id}
                                    draggable={shift.estado !== 'solicitud_cambio'}
                                    onDragStart={(e) => handleDragStart(e, shift)}
                                    className={`
                                        p-4 rounded-xl border transition-all flex items-center justify-between
                                        ${shift.estado === 'solicitud_cambio'
                                            ? 'bg-amber-900/20 border-amber-700/50 opacity-75 cursor-default'
                                            : 'bg-[#112240] border-slate-700 hover:border-teal-400 hover:shadow-lg cursor-grab active:cursor-grabbing'
                                        }
                                    `}
                                >
                                    <div>
                                        <p className="font-bold text-slate-100 capitalize">
                                            {new Date(shift.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${shift.dia_semana === 'viernes' ? 'bg-purple-900/30 text-purple-300' : 'bg-teal-900/30 text-teal-300'}`}>
                                                {shift.dia_semana}
                                            </span>
                                            {shift.estado === 'solicitud_cambio' && (
                                                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                                                    <RefreshCw size={12} /> Solicitado
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {shift.estado !== 'solicitud_cambio' && (
                                        <div className="text-slate-500">
                                            <ArrowRight size={20} />
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 italic">No tienes turnos futuros asignados.</p>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: CANASTA Y OPORTUNIDADES */}
                <div className="flex flex-col h-full space-y-8">
                    {/* CANASTA */}
                    <div>
                        <h2 className="font-bold text-slate-300 flex items-center gap-2 mb-4">
                            <AlertCircle size={20} />
                            Canasta de Solicitudes
                        </h2>

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                                rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all
                                ${dropZoneActive
                                    ? 'border-teal-500 bg-teal-900/20 scale-[1.02]'
                                    : 'border-slate-600 bg-[#112240]'
                                }
                            `}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${dropZoneActive ? 'bg-teal-900/40 text-teal-400' : 'bg-slate-800 text-slate-500'}`}>
                                <RefreshCw size={32} className={dropZoneActive ? 'animate-spin' : ''} />
                            </div>

                            <h3 className={`text-base font-bold mb-1 ${dropZoneActive ? 'text-teal-400' : 'text-slate-400'}`}>
                                {dropZoneActive ? '¡Suelta para solicitar!' : 'Arrastra aquí para solicitar cambio'}
                            </h3>
                        </div>
                    </div>

                    {/* OPORTUNIDADES */}
                    <div className="flex-1">
                        <h2 className="font-bold text-slate-300 flex items-center gap-2 mb-4">
                            <CheckCircle2 size={20} className="text-teal-400" />
                            Turnos Disponibles
                        </h2>

                        <div className="space-y-3">
                            {availableShifts.length > 0 ? (
                                availableShifts.map(shift => (
                                    <div key={shift.id} className="bg-[#112240] border border-slate-700 rounded-xl p-4 hover:border-teal-500/50 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-bold text-slate-100 capitalize">
                                                    {new Date(shift.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">Solicitado por compañera</p>
                                            </div>
                                            <span className="bg-teal-900/30 text-teal-400 text-[10px] font-bold px-2 py-1 rounded">
                                                CUNA
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleTakeShift(shift)}
                                            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-lg transition-colors"
                                        >
                                            Tomar Turno
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 bg-[#112240]/50 rounded-xl border border-slate-800">
                                    <p className="text-slate-500 text-sm">No hay turnos disponibles para tomar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
