import React, { useEffect, useState } from 'react';
import { X, Calendar, Star } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function WorkerQuickLook({ worker, onClose }) {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ cumplidos: 0, cubiertos: 0, no_cumplidos: 0 });

    useEffect(() => {
        fetchHistory();
    }, [worker]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            // Mostrar mes actual y siguiente
            const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];

            // Fetch assignments where worker is titular OR coverage
            // Note: We need to join with cuna_calendario to filter by date
            const { data, error } = await supabase
                .from('cuna_turnos')
                .select(`
                    id,
                    estado,
                    trabajador_id,
                    trabajador_cobertura_id,
                    cuna_calendario!inner (
                        fecha,
                        dia_semana
                    )
                `)
                .or(`trabajador_id.eq.${worker.id},trabajador_cobertura_id.eq.${worker.id}`)
                .gte('cuna_calendario.fecha', startOfMonth)
                .lte('cuna_calendario.fecha', endOfNextMonth)
                .order('fecha', { foreignTable: 'cuna_calendario', ascending: true });

            if (error) throw error;

            // Process data
            const processed = data.map(t => {
                const isTitular = t.trabajador_id === worker.id;
                const isCobertura = t.trabajador_cobertura_id === worker.id;
                const fecha = t.cuna_calendario.fecha;
                const isPast = new Date(fecha) < new Date();

                let status = 'pendiente';
                if (isPast) {
                    if (isTitular && t.trabajador_cobertura_id) status = 'cubierto_por_otro'; // Ella faltó/cambió
                    else if (isCobertura) status = 'cobertura_realizada'; // Ella cubrió
                    else status = 'cumplido'; // Ella fue titular y cumplió
                } else {
                    status = 'programado';
                    if (isTitular && t.trabajador_cobertura_id) status = 'cubierto_por_otro_futuro';
                    if (isCobertura) status = 'cobertura_programada';
                }

                return { ...t, computedStatus: status, fecha: t.cuna_calendario.fecha, dia: t.cuna_calendario.dia_semana };
            });

            // Sort by date (client side sort to be safe)
            processed.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            setAssignments(processed);

            // Calculate stats (simple logic for now)
            const newStats = processed.reduce((acc, curr) => {
                if (curr.computedStatus === 'cumplido' || curr.computedStatus === 'cobertura_realizada') acc.cumplidos++;
                if (curr.computedStatus === 'cubierto_por_otro') acc.cubiertos++; // Veces que ella necesitó cobertura
                return acc;
            }, { cumplidos: 0, cubiertos: 0, no_cumplidos: 0 });

            setStats(newStats);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Traffic Light Logic
    const getTrafficLight = () => {
        if (stats.cubiertos > 1) return { color: 'bg-red-500', borderColor: 'border-red-500', text: 'Atención Pastoral' };
        if (stats.cubiertos === 1) return { color: 'bg-yellow-500', borderColor: 'border-yellow-500', text: 'Observación' };
        return { color: 'bg-green-500', borderColor: 'border-green-500', text: 'Saludable' };
    };

    const traffic = getTrafficLight();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex justify-end">
            <div className="w-96 bg-[#112240] h-full shadow-2xl border-l border-slate-700 p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {worker.nombre} {worker.apellido}
                            {worker.disponible_viernes && <Star className="text-amber-400 fill-amber-400" size={18} />}
                        </h2>
                        <p className="text-slate-400 capitalize">{worker.rol}</p>
                        <div className="mt-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${worker.estado_participacion === 'activa' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                    worker.estado_participacion === 'descanso' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                {worker.estado_participacion || 'Activa'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
                </div>

                {/* Traffic Light */}
                <div className={`p-4 rounded-lg mb-6 flex items-center justify-between ${traffic.color} bg-opacity-10 border ${traffic.borderColor} border-opacity-30`}>
                    <span className="font-bold text-slate-200">Estado Pastoral</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${traffic.color} text-white shadow-sm`}>{traffic.text}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#0a192f] p-3 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-500 mb-1">Turnos Cumplidos</p>
                        <p className="text-2xl font-bold text-teal-400">{stats.cumplidos}</p>
                    </div>
                    <div className="bg-[#0a192f] p-3 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-500 mb-1">Coberturas Solicitadas</p>
                        <p className="text-2xl font-bold text-amber-400">{stats.cubiertos}</p>
                    </div>
                </div>

                {/* List */}
                <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <Calendar size={16} />
                    Actividad (Mes Actual + Siguiente)
                </h3>

                <div className="space-y-3">
                    {loading ? <p className="text-slate-500 text-center">Cargando...</p> :
                        assignments.length === 0 ? <p className="text-slate-500 text-center italic">Sin actividad registrada</p> :
                            assignments.map(a => (
                                <div key={a.id} className="bg-[#0a192f] p-3 rounded border border-slate-700 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-slate-200 capitalize">
                                            {new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <p className="text-xs text-slate-500 capitalize">{a.dia}</p>
                                    </div>
                                    <StatusBadge status={a.computedStatus} />
                                </div>
                            ))}
                </div>
            </div>
        </div>
    );
}

const StatusBadge = ({ status }) => {
    const styles = {
        cumplido: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
        cobertura_realizada: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
        cubierto_por_otro: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        programado: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        cubierto_por_otro_futuro: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        cobertura_programada: 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    };

    const labels = {
        cumplido: 'Cumplido',
        cobertura_realizada: 'Cubrió Turno',
        cubierto_por_otro: 'Fue Cubierta',
        programado: 'Programado',
        cubierto_por_otro_futuro: 'Será Cubierta',
        cobertura_programada: 'Cubrirá Turno'
    };

    return (
        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${styles[status] || styles.programado}`}>
            {labels[status] || status}
        </span>
    );
};
