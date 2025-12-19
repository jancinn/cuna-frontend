import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar as CalendarIcon, Clock, User, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import ServidoraHeader from './ServidoraHeader';

export default function CunaCalendarioServidora() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [myShifts, setMyShifts] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchMyShifts();
    }, [currentDate]);

    const fetchMyShifts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
            const endStr = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

            // Fetch turnos del mes para el usuario
            const { data, error } = await supabase
                .from('cuna_turnos')
                .select(`
                    id,
                    slot_numero,
                    estado,
                    cuna_calendario (
                        id,
                        fecha,
                        dia_semana,
                        cuna_turnos (
                            trabajador_id,
                            slot_numero
                        )
                    )
                `)
                .eq('trabajador_id', user.id)
                .gte('cuna_calendario.fecha', startStr)
                .lte('cuna_calendario.fecha', endStr)
                .order('cuna_calendario(fecha)', { ascending: true });

            if (error) throw error;

            // Enriquecer con nombres de compañeros (fetch simple de todos los workers para mapear)
            const { data: workerResponse } = await supabase.functions.invoke('listar-trabajadores');
            const allWorkers = Array.isArray(workerResponse) ? workerResponse : [];

            const shifts = data.map(t => {
                // Encontrar compañero (el otro slot del mismo día)
                const partnerTurn = t.cuna_calendario.cuna_turnos.find(pt => pt.slot_numero !== t.slot_numero);
                const partnerWorker = partnerTurn ? allWorkers.find(w => w.id === partnerTurn.trabajador_id) : null;

                return {
                    id: t.id,
                    fecha: t.cuna_calendario.fecha,
                    dia_semana: t.cuna_calendario.dia_semana,
                    slot: t.slot_numero,
                    estado: t.estado,
                    partnerName: partnerWorker ? `${partnerWorker.nombre} ${partnerWorker.apellido}` : 'Por asignar'
                };
            });

            setMyShifts(shifts);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    if (loading) return <div className="p-8 text-slate-500">Cargando calendario...</div>;

    return (
        <div className="p-4 md:p-8 pt-20 md:pt-8 max-w-4xl mx-auto font-sans text-slate-800">
            <ServidoraHeader />
            {/* ENCABEZADO */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 capitalize">
                        <CalendarIcon className="text-blue-600" />
                        {monthName}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Tienes <strong className="text-blue-600">{myShifts.length} turno(s)</strong> programado(s) este mes.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/servidora/intercambios')}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:border-blue-400 transition-all flex items-center gap-2 shadow-sm"
                >
                    <RefreshCw size={16} />
                    Ir a Intercambios
                </button>
            </header>

            {/* LISTADO DE TURNOS */}
            <div className="space-y-4">
                {myShifts.length > 0 ? (
                    myShifts.map(shift => (
                        <div
                            key={shift.id}
                            className={`
                                relative overflow-hidden rounded-xl border p-5 transition-all
                                ${shift.estado === 'solicitud_cambio'
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-white border-slate-200 hover:shadow-md'
                                }
                            `}
                        >
                            {/* Indicador de Estado */}
                            <div className="absolute top-0 right-0 p-3">
                                {shift.estado === 'solicitud_cambio' ? (
                                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <RefreshCw size={12} /> Solicitado
                                    </span>
                                ) : (
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Confirmado
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                {/* Fecha */}
                                <div className="flex-shrink-0 text-center md:text-left">
                                    <p className="text-3xl font-black text-slate-800">
                                        {new Date(shift.fecha + 'T00:00:00').getDate()}
                                    </p>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                        {new Date(shift.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' })}
                                    </p>
                                </div>

                                {/* Detalles */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${shift.dia_semana === 'viernes' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                                            {shift.dia_semana}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">
                                            • Cuna (0-2 años)
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-600">
                                        <User size={16} className="text-slate-400" />
                                        <span className="text-sm">
                                            Compañera: <strong className="text-slate-800">{shift.partnerName}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <CalendarIcon size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Sin turnos este mes</h3>
                        <p className="text-slate-400 text-sm mt-1">No tienes asignaciones programadas para {monthName}.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
