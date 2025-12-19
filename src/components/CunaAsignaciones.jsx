import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Wand2,
    ChevronLeft,
    ChevronRight,
    User,
    AlertTriangle,
    RefreshCw,
    CheckCircle2,
    Eye
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import WorkerQuickLook from './WorkerQuickLook';

const AssignmentCard = ({ date, slots, onSlotClick, selectedSlot }) => {
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    const dayName = day;
    const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();

    return (
        <div className="bg-[#112240] rounded-xl border border-slate-700 overflow-hidden mb-4">
            <div className="bg-[#0a192f] px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                <span className="font-bold text-slate-300 text-sm">{dayName} {monthName}</span>
            </div>
            <div className="p-3 space-y-2">
                {[1, 2].map(slotNum => {
                    const slot = slots.find(s => s.slot_numero === slotNum);
                    const isSelected = selectedSlot && selectedSlot.id === slot?.id;
                    const isPendingExchange = slot?.estado === 'solicitud_cambio';

                    return (
                        <div
                            key={slotNum}
                            onClick={() => onSlotClick(slot, date, slotNum)}
                            className={`
                                p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden
                                ${isSelected
                                    ? 'bg-teal-500/20 border-teal-500 ring-1 ring-teal-500'
                                    : isPendingExchange
                                        ? 'bg-amber-500/10 border-amber-500/50'
                                        : 'bg-[#0a192f] border-slate-700 hover:border-slate-500'
                                }
                            `}
                        >
                            {isPendingExchange && (
                                <div className="absolute top-0 right-0 p-1">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Solicitud de cambio pendiente" />
                                </div>
                            )}

                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 relative">
                                {slot?.trabajador_avatar ? (
                                    <img src={slot.trabajador_avatar} alt="" className="w-full h-full rounded-full" />
                                ) : (
                                    <User size={14} />
                                )}
                                {slot?.tiene_estrella && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-[#0a192f]" title="Disponible Viernes" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                {slot?.cobertura_nombre ? (
                                    <>
                                        <p className="text-[10px] text-slate-500 line-through decoration-slate-600">
                                            {slot.trabajador_nombre}
                                        </p>
                                        <p className="text-sm font-bold text-purple-400 flex items-center gap-1">
                                            <span className="text-[10px] bg-purple-500/10 px-1 rounded border border-purple-500/20">CUBRE</span>
                                            {slot.cobertura_nombre}
                                        </p>
                                    </>
                                ) : (
                                    <p className={`text-sm font-medium truncate ${slot?.trabajador_nombre ? 'text-slate-200' : 'text-slate-500 italic'}`}>
                                        {slot?.trabajador_nombre || 'Vacante'}
                                    </p>
                                )}

                                {isPendingExchange && (
                                    <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                                        <RefreshCw size={10} /> Pendiente de cambio
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function CunaAsignaciones() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [selectedWorker, setSelectedWorker] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [pendingExchanges, setPendingExchanges] = useState([]);
    const [quickLookWorker, setQuickLookWorker] = useState(null);

    // Derived state for header status
    const isGenerated = calendarData.length > 0 && calendarData.some(d => d.cuna_turnos.length > 0);

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (!supabase) return;

            const { data: workersData } = await supabase.functions.invoke('listar-trabajadores');
            setWorkers(workersData || []);

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const lastDay = new Date(year, month, 0).getDate();

            const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
            const endStr = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

            const { data: calData, error } = await supabase
                .from('cuna_calendario')
                .select(`
                    id,
                    fecha,
                    dia_semana,
                    habilitado,
                    cuna_turnos (
                        id,
                        slot_numero,
                        estado,
                        trabajador_id,
                        trabajador_cobertura_id
                    )
                `)
                .gte('fecha', startStr)
                .lte('fecha', endStr)
                .order('fecha');

            if (error) throw error;

            const enriched = calData?.map(day => ({
                ...day,
                cuna_turnos: day.cuna_turnos.map(turn => {
                    const w = workersData?.find(wk => wk.id === turn.trabajador_id);
                    const coverage = turn.trabajador_cobertura_id ? workersData?.find(wk => wk.id === turn.trabajador_cobertura_id) : null;

                    return {
                        ...turn,
                        trabajador_nombre: w ? w.nombre_completo : null,
                        trabajador_avatar: w ? w.avatar : null,
                        tiene_estrella: w ? w.disponible_viernes : false,
                        cobertura_nombre: coverage ? coverage.nombre_completo : null,
                        cobertura_avatar: coverage ? coverage.avatar : null
                    };
                })
            }));

            setCalendarData(enriched || []);

            // Process Pending Exchanges
            const pending = [];
            enriched?.forEach(day => {
                day.cuna_turnos.forEach(turn => {
                    if (turn.estado === 'solicitud_cambio') {
                        pending.push({
                            ...turn,
                            fecha: day.fecha,
                            dia_semana: day.dia_semana
                        });
                    }
                });
            });
            setPendingExchanges(pending);

        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReassign = async (turnId, newWorkerId) => {
        if (!confirm('¿Confirmas la cobertura para este turno? El titular original se mantendrá en el registro.')) return;
        try {
            const { error } = await supabase
                .from('cuna_turnos')
                .update({
                    trabajador_cobertura_id: newWorkerId,
                    estado: 'asignado' // Vuelve a estado asignado, pero con cobertura
                })
                .eq('id', turnId);

            if (error) throw error;
            fetchData();
        } catch (err) {
            alert('Error al asignar cobertura: ' + err.message);
        }
    };

    const handleCancelExchange = async (turnId) => {
        if (!confirm('¿Cancelar solicitud y mantener asignación original?')) return;
        try {
            const { error } = await supabase
                .from('cuna_turnos')
                .update({ estado: 'asignado' })
                .eq('id', turnId);

            if (error) throw error;
            fetchData();
        } catch (err) {
            alert('Error al cancelar: ' + err.message);
        }
    };

    const handleGenerate = async () => {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        if (!confirm(`¿Asignar automáticamente para ${month}/${year}?`)) return;

        setGenerating(true);
        try {
            const activeWorkers = workers.filter(w => w.activo && w.estado_participacion === 'activa');
            if (activeWorkers.length === 0) throw new Error("No hay trabajadoras activas para asignar.");

            const shuffledWorkers = [...activeWorkers].sort(() => Math.random() - 0.5);
            const fridayWorkers = shuffledWorkers.filter(w => w.disponible_viernes);
            const sundayWorkers = [...shuffledWorkers];

            const startDate = new Date(Date.UTC(year, month - 1, 1));
            const endDate = new Date(Date.UTC(year, month, 0));
            const dates = [];

            for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
                const day = d.getUTCDay();
                if (day === 5 || day === 0) {
                    dates.push({
                        date: new Date(d),
                        type: day === 5 ? 'viernes' : 'domingo'
                    });
                }
            }

            const assignments = [];
            const assignedUserIds = new Set();
            const calendarUpserts = [];

            for (const dateObj of dates) {
                const dateStr = dateObj.date.toISOString().split('T')[0];
                calendarUpserts.push({
                    fecha: dateStr,
                    dia_semana: dateObj.type,
                    habilitado: true
                });
            }

            const { data: calendarDays, error: calError } = await supabase
                .from("cuna_calendario")
                .upsert(calendarUpserts, { onConflict: 'fecha' })
                .select();

            if (calError) throw calError;

            for (const dayData of calendarDays) {
                const isFriday = dayData.dia_semana === 'viernes';
                const dailyAssigned = new Set();

                for (let slot = 1; slot <= 2; slot++) {
                    let candidate = null;
                    let pool = isFriday ? fridayWorkers : sundayWorkers;
                    let availablePool = pool.filter(w => w && w.usuario_id && !dailyAssigned.has(w.usuario_id));

                    candidate = availablePool.find(w => !assignedUserIds.has(w.usuario_id));

                    if (!candidate && availablePool.length > 0) {
                        candidate = availablePool[0];
                    }

                    if (candidate) {
                        assignedUserIds.add(candidate.usuario_id);
                        dailyAssigned.add(candidate.usuario_id);

                        assignments.push({
                            calendario_id: dayData.id,
                            slot_numero: slot,
                            estado: 'asignado',
                            trabajador_id: candidate.usuario_id
                        });

                        if (isFriday) {
                            const idx = fridayWorkers.findIndex(w => w && w.usuario_id === candidate.usuario_id);
                            if (idx > -1) fridayWorkers.push(fridayWorkers.splice(idx, 1)[0]);
                        } else {
                            const idx = sundayWorkers.findIndex(w => w && w.usuario_id === candidate.usuario_id);
                            if (idx > -1) sundayWorkers.push(sundayWorkers.splice(idx, 1)[0]);
                        }
                    } else {
                        assignments.push({
                            calendario_id: dayData.id,
                            slot_numero: slot,
                            estado: 'liberado',
                            trabajador_id: null
                        });
                    }
                }
            }

            if (assignments.length > 0) {
                const { error: insertError } = await supabase
                    .from("cuna_turnos")
                    .upsert(assignments, { onConflict: 'calendario_id, slot_numero' });

                if (insertError) throw insertError;
            }

            await fetchData();
            alert(`Asignación completada: ${assignments.length} turnos generados.`);
        } catch (err) {
            console.error('Error generating:', err);
            alert('Error: ' + err.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSlotClick = async (slot, date, slotNum) => {
        if (selectedWorker) {
            await assignWorkerToSlot(selectedWorker.id, slot, date, slotNum);
            setSelectedWorker(null);
            return;
        }

        if (selectedSlot) {
            if (selectedSlot.id === slot?.id) {
                setSelectedSlot(null);
            } else {
                await swapSlots(selectedSlot, slot, date, slotNum);
                setSelectedSlot(null);
            }
            return;
        }

        if (slot && slot.trabajador_id) {
            setSelectedSlot({ ...slot, date, slotNum });
        }
    };

    const assignWorkerToSlot = async (workerId, currentSlot, dateStr, slotNum) => {
        const dayData = calendarData.find(d => d.fecha === dateStr);
        if (!dayData) return;

        try {
            const { error } = await supabase
                .from('cuna_turnos')
                .upsert({
                    calendario_id: dayData.id,
                    slot_numero: slotNum,
                    trabajador_id: workerId,
                    estado: 'asignado'
                }, { onConflict: 'calendario_id, slot_numero' });

            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error al asignar');
        }
    };

    const swapSlots = async (sourceSlot, targetSlot, targetDate, targetSlotNum) => {
        const targetDayData = calendarData.find(d => d.fecha === targetDate);
        if (!targetDayData) return;

        try {
            const { error: err1 } = await supabase
                .from('cuna_turnos')
                .upsert({
                    calendario_id: targetDayData.id,
                    slot_numero: targetSlotNum,
                    trabajador_id: sourceSlot.trabajador_id,
                    estado: 'asignado'
                }, { onConflict: 'calendario_id, slot_numero' });

            if (err1) throw err1;

            if (targetSlot && targetSlot.id && sourceSlot.id) {
                await supabase.from('cuna_turnos').update({ trabajador_id: targetSlot.trabajador_id }).eq('id', sourceSlot.id);
                await supabase.from('cuna_turnos').update({ trabajador_id: sourceSlot.trabajador_id }).eq('id', targetSlot.id);
            } else {
                const sourceDay = calendarData.find(d => d.cuna_turnos.some(t => t.id === sourceSlot.id));
                if (sourceDay) {
                    await supabase
                        .from('cuna_turnos')
                        .upsert({
                            calendario_id: sourceDay.id,
                            slot_numero: sourceSlot.slot_numero,
                            trabajador_id: targetSlot?.trabajador_id || null,
                            estado: 'asignado'
                        }, { onConflict: 'calendario_id, slot_numero' });
                }
            }

            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error al intercambiar');
        }
    };

    const fridays = calendarData.filter(d => d.dia_semana === 'viernes' && d.habilitado);
    const sundays = calendarData.filter(d => d.dia_semana === 'domingo');
    const activeWorkers = workers.filter(w => w.activo);

    return (
        <div className="flex h-[calc(100vh-64px)] bg-[#0a192f] text-slate-200 font-sans overflow-hidden">
            <div className="flex-1 flex min-h-0">
                {/* ZONA CENTRAL */}
                <main className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
                    {/* Toolbar & Header */}
                    <div className="p-4 border-b border-slate-800 bg-[#112240] space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-700 rounded"><ChevronLeft /></button>
                                <h2 className="text-lg font-bold text-white capitalize w-40 text-center">
                                    {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                </h2>
                                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-700 rounded"><ChevronRight /></button>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Estado del Mes</span>
                                    {isGenerated ? (
                                        <span className="text-teal-400 font-bold flex items-center gap-1 text-sm"><CheckCircle2 size={14} /> Generado</span>
                                    ) : (
                                        <span className="text-slate-500 font-bold flex items-center gap-1 text-sm">No Generado</span>
                                    )}
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold shadow-lg shadow-teal-900/20 transition-all"
                                >
                                    <Wand2 size={16} />
                                    {generating ? 'Asignando...' : 'Generar Listas'}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 px-2">
                            <span>Regla base: 1 vez al mes</span>
                            <span>Mostrando calendario operativo (Viernes / Domingo)</span>
                        </div>
                    </div>

                    {/* Columnas Viernes / Domingo */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            {/* Columna Viernes */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-center gap-2 pb-4 border-b border-slate-800 mb-2">
                                    <h3 className="text-xl font-black text-purple-400 tracking-wider">VIERNES</h3>
                                </div>
                                {fridays.map(day => (
                                    <AssignmentCard
                                        key={day.id}
                                        date={day.fecha}
                                        slots={day.cuna_turnos}
                                        onSlotClick={handleSlotClick}
                                        selectedSlot={selectedSlot}
                                    />
                                ))}
                                {fridays.length === 0 && <p className="text-center text-slate-600 italic mt-10">No hay viernes habilitados</p>}
                            </div>

                            {/* Columna Domingo */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-center gap-2 pb-4 border-b border-slate-800 mb-2">
                                    <h3 className="text-xl font-black text-teal-400 tracking-wider">DOMINGO</h3>
                                </div>
                                {sundays.map(day => (
                                    <AssignmentCard
                                        key={day.id}
                                        date={day.fecha}
                                        slots={day.cuna_turnos}
                                        onSlotClick={handleSlotClick}
                                        selectedSlot={selectedSlot}
                                    />
                                ))}
                                {sundays.length === 0 && <p className="text-center text-slate-600 italic mt-10">No hay domingos este mes</p>}
                            </div>
                        </div>

                        {/* SECCIÓN INTERCAMBIOS */}
                        <div className="mt-8 pt-8 border-t border-slate-800">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <RefreshCw className="text-amber-400" size={20} />
                                Intercambios Pendientes
                            </h3>

                            {pendingExchanges.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {pendingExchanges.map(ex => (
                                        <div key={ex.id} className="bg-[#112240] border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3 shadow-lg shadow-amber-900/10">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-slate-200 capitalize">
                                                        {new Date(ex.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">Solicitado por:</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <img src={ex.trabajador_avatar} className="w-6 h-6 rounded-full bg-slate-700" alt="" />
                                                        <span className="text-sm font-medium text-slate-300">{ex.trabajador_nombre}</span>
                                                    </div>
                                                </div>
                                                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                                    Pendiente
                                                </span>
                                            </div>

                                            <div className="pt-3 border-t border-slate-700/50 flex gap-2">
                                                <select
                                                    className="bg-[#0a192f] text-xs text-slate-300 border border-slate-700 rounded px-2 py-1 flex-1 outline-none focus:border-teal-500"
                                                    onChange={(e) => {
                                                        if (e.target.value) handleReassign(ex.id, e.target.value);
                                                    }}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Reasignar a...</option>
                                                    {workers.filter(w => w.activo && w.id !== ex.trabajador_id).map(w => (
                                                        <option key={w.id} value={w.id}>{w.nombre} {w.apellido}</option>
                                                    ))}
                                                </select>

                                                <button
                                                    onClick={() => handleCancelExchange(ex.id)}
                                                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded font-medium transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#112240] border border-slate-700 border-dashed rounded-xl p-8 text-center">
                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <p className="text-slate-400 font-medium">No hay solicitudes pendientes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* COLUMNA DERECHA - SERVIDORAS */}
                <aside className="w-80 bg-[#112240] flex flex-col border-l border-slate-800 shadow-2xl z-10">
                    <div className="p-5 border-b border-slate-800">
                        <h2 className="font-bold text-slate-100 mb-1">Servidoras Activas</h2>
                        <p className="text-xs text-slate-500">Selecciona para asignar</p>
                    </div>

                    <div className="p-4 border-b border-slate-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full bg-[#0a192f] border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {activeWorkers.map(worker => (
                            <div
                                key={worker.id}
                                onClick={() => setSelectedWorker(worker)}
                                className={`
                                    p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all relative
                                    ${selectedWorker?.id === worker.id
                                        ? 'bg-teal-600 border-teal-500 shadow-lg shadow-teal-900/50 transform scale-105'
                                        : 'bg-[#0a192f] border-slate-800 hover:border-slate-600 hover:bg-[#0f2442]'
                                    }
                                `}
                            >
                                <div className="relative">
                                    <img src={worker.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-700" />
                                    {worker.disponible_viernes && (
                                        <div
                                            className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-[#0a192f]"
                                            title="Disponible Viernes y Domingo"
                                        />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-100 truncate">{worker.nombre} {worker.apellido}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{worker.rol}</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setQuickLookWorker(worker);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-slate-700 rounded-full transition-colors"
                                    title="Ver Detalle"
                                >
                                    <Eye size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>

            {quickLookWorker && (
                <WorkerQuickLook
                    worker={quickLookWorker}
                    onClose={() => setQuickLookWorker(null)}
                />
            )}
        </div>
    );
}
