import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    LayoutDashboard,
    Calendar,
    Users,
    MessageSquare,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ArrowRight
} from 'lucide-react';

export default function CunaDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeWorkers: 0,
        monthAssignments: 0,
        pendingExchanges: 0,
        nextServices: []
    });

    const currentDate = new Date();
    const currentMonthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            if (!supabase) return;

            // 1. Trabajadoras Activas
            const { count: activeWorkers } = await supabase
                .from('cuna_trabajadores')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true);

            // 2. Asignaciones del Mes
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
            const endStr = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

            const { data: monthCalendar } = await supabase
                .from('cuna_calendario')
                .select('id')
                .gte('fecha', startStr)
                .lte('fecha', endStr);

            let monthAssignments = 0;
            if (monthCalendar && monthCalendar.length > 0) {
                const calendarIds = monthCalendar.map(c => c.id);
                const { count } = await supabase
                    .from('cuna_turnos')
                    .select('*', { count: 'exact', head: true })
                    .in('calendario_id', calendarIds)
                    .eq('estado', 'asignado');
                monthAssignments = count || 0;
            }

            // 3. Intercambios Pendientes
            const { count: pendingExchanges } = await supabase
                .from('cuna_turnos')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'solicitud_cambio');

            // 4. Próximos Servicios (2)
            const todayStr = currentDate.toISOString().split('T')[0];
            const { data: nextCal } = await supabase
                .from('cuna_calendario')
                .select(`
                    fecha,
                    dia_semana,
                    cuna_turnos (
                        trabajador_id
                    )
                `)
                .gte('fecha', todayStr)
                .order('fecha')
                .limit(2);

            // Enriquecer con nombres (simple fetch de todos los workers para mapear rápido)
            // Nota: Podríamos optimizar haciendo fetch solo de los IDs necesarios, pero listar-trabajadores ya está optimizada.
            const { data: workerResponse } = await supabase.functions.invoke('listar-trabajadores');
            const allWorkers = Array.isArray(workerResponse) ? workerResponse : [];

            const enrichedServices = nextCal?.map(day => {
                const assignedNames = day.cuna_turnos.map(t => {
                    const w = allWorkers.find(wk => wk.id === t.trabajador_id);
                    return w ? w.nombre.split(' ')[0] : 'Vacante';
                });
                return {
                    ...day,
                    assignedNames
                };
            }) || [];

            setStats({
                activeWorkers: activeWorkers || 0,
                monthAssignments,
                pendingExchanges: pendingExchanges || 0,
                nextServices: enrichedServices
            });

        } catch (err) {
            console.error("Error loading dashboard:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-slate-400">Cargando panel de control...</div>;
    }

    return (
        <div className="p-8 text-slate-200 font-sans max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <LayoutDashboard className="text-teal-400" />
                    Panel de Control
                </h1>
                <p className="text-slate-400 mt-1">Resumen operativo - {currentMonthName}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* A. ESTADO DEL MES */}
                <div className="bg-[#112240] p-6 rounded-xl border border-slate-800 shadow-lg">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-400" />
                        Estado del Mes
                    </h2>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-[#0a192f] rounded-lg border border-slate-700">
                            <span className="text-slate-400 text-sm">Estado de Listas</span>
                            {stats.monthAssignments > 0 ? (
                                <span className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                                    <CheckCircle2 size={16} /> Generadas
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                                    <AlertTriangle size={16} /> Pendientes
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#0a192f] p-3 rounded-lg border border-slate-700 text-center">
                                <span className="block text-2xl font-bold text-white">{stats.activeWorkers}</span>
                                <span className="text-xs text-slate-500">Servidoras Activas</span>
                            </div>
                            <div className="bg-[#0a192f] p-3 rounded-lg border border-slate-700 text-center">
                                <span className="block text-2xl font-bold text-white">{stats.monthAssignments}</span>
                                <span className="text-xs text-slate-500">Turnos Asignados</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* B. ALERTAS OPERATIVAS */}
                <div className="bg-[#112240] p-6 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertTriangle size={100} />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                        <AlertTriangle size={20} className="text-amber-400" />
                        Atención Requerida
                    </h2>

                    <div className="space-y-3 relative z-10">
                        <div className="flex justify-between items-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <div>
                                <p className="font-bold text-amber-400">Intercambios</p>
                                <p className="text-xs text-amber-200/70">Solicitudes pendientes</p>
                            </div>
                            <span className="text-3xl font-bold text-amber-400">{stats.pendingExchanges}</span>
                        </div>

                        {stats.monthAssignments === 0 && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-sm text-red-400 font-medium">⚠️ El calendario de este mes aún no ha sido generado.</p>
                            </div>
                        )}

                        {stats.pendingExchanges === 0 && stats.monthAssignments > 0 && (
                            <div className="p-4 text-center text-slate-500 italic">
                                No hay alertas activas por el momento.
                            </div>
                        )}
                    </div>
                </div>

                {/* C. PRÓXIMOS SERVICIOS */}
                <div className="bg-[#112240] p-6 rounded-xl border border-slate-800 shadow-lg">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-purple-400" />
                        Próximos Servicios
                    </h2>

                    <div className="space-y-3">
                        {stats.nextServices.length > 0 ? (
                            stats.nextServices.map((service, idx) => (
                                <div key={idx} className="p-3 bg-[#0a192f] rounded-lg border border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-200 capitalize">
                                            {new Date(service.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${service.dia_semana === 'viernes' ? 'bg-purple-500/20 text-purple-400' : 'bg-teal-500/20 text-teal-400'}`}>
                                            {service.dia_semana}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {service.assignedNames.length > 0 ? (
                                            service.assignedNames.map((name, i) => (
                                                <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                                                    {name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-500 italic">Sin asignar</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm">No hay servicios próximos registrados.</p>
                        )}
                    </div>
                </div>

                {/* D. ACCESOS DIRECTOS */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Accesos Rápidos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onClick={() => navigate('/asignaciones')} className="group p-4 bg-[#112240] hover:bg-[#1d355e] border border-slate-700 hover:border-teal-500/50 rounded-xl transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                    <Calendar size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">Asignaciones</h3>
                                    <p className="text-xs text-slate-400">Gestionar calendario y turnos</p>
                                </div>
                            </div>
                            <ArrowRight size={20} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button onClick={() => navigate('/servidoras')} className="group p-4 bg-[#112240] hover:bg-[#1d355e] border border-slate-700 hover:border-teal-500/50 rounded-xl transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                                    <Users size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-white group-hover:text-teal-400 transition-colors">Servidoras</h3>
                                    <p className="text-xs text-slate-400">Directorio y perfiles</p>
                                </div>
                            </div>
                            <ArrowRight size={20} className="text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button onClick={() => navigate('/comunicacion')} className="group p-4 bg-[#112240] hover:bg-[#1d355e] border border-slate-700 hover:border-teal-500/50 rounded-xl transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                    <MessageSquare size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">Comunicación</h3>
                                    <p className="text-xs text-slate-400">Mensajes y avisos</p>
                                </div>
                            </div>
                            <ArrowRight size={20} className="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
