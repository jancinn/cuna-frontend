import React, { useState } from 'react';
import {
    Calendar,
    MessageSquare,
    Bell,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    User,
    CheckCircle,
    AlertTriangle,
    PlusCircle,
    Clock
} from 'lucide-react';
import { mockServidoras, mockTurnos } from './mockData';

// --- CONSTANTES DE ESTILO ---
const COLORS = {
    bg: "bg-[#0a192f]", // Deep Navy
    card: "bg-[#112240]", // Light Navy
    cardHover: "hover:bg-[#1d3557]",
    accent: "text-teal-300", // Soft Teal
    textMain: "text-slate-200",
    textMuted: "text-slate-400",
    border: "border-slate-700"
};

const STATUS_CONFIG = {
    confirmado: { icon: CheckCircle, color: "text-green-400", label: "Confirmado" },
    asignado: { icon: Clock, color: "text-slate-400", label: "Pendiente" },
    solicitud: { icon: AlertTriangle, color: "text-yellow-400", label: "Solicitud" },
    vacante: { icon: PlusCircle, color: "text-red-400", label: "Vacante" }
};

// --- COMPONENTES ---

const Header = () => (
    <header className={`flex items-center justify-between p-6 ${COLORS.bg} border-b ${COLORS.border}`}>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-teal-900/30 ${COLORS.accent}`}>
                <Calendar size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
                Cuna <span className="font-light opacity-70">· Planificador Maestro</span>
            </h1>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#112240] border border-slate-700">
                <button className={`${COLORS.textMuted} hover:text-white`}><ChevronLeft size={20} /></button>
                <span className="font-medium text-white min-w-[100px] text-center">Noviembre 2025</span>
                <button className={`${COLORS.textMuted} hover:text-white`}><ChevronRight size={20} /></button>
            </div>

            <button className="relative p-2 rounded-full hover:bg-slate-800 transition-colors">
                <Bell size={20} className={COLORS.textMain} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold">
                R
            </div>
        </div>
    </header>
);

const SlotCard = ({ slot }) => {
    const StatusIcon = STATUS_CONFIG[slot.estado].icon;
    const statusColor = STATUS_CONFIG[slot.estado].color;
    const isVacant = slot.estado === 'vacante';

    return (
        <div className={`
      group relative flex items-center gap-3 p-3 rounded-lg border transition-all
      ${isVacant ? 'border-dashed border-slate-600 bg-transparent' : `${COLORS.card} border-transparent`}
      ${COLORS.cardHover}
    `}>
            {/* Avatar / Icono */}
            <div className="flex-shrink-0">
                {slot.servidora ? (
                    <img
                        src={slot.servidora.avatar}
                        alt={slot.servidora.nombre}
                        className="w-10 h-10 rounded-full border-2 border-[#0a192f]"
                    />
                ) : (
                    <div className={`w-10 h-10 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center ${COLORS.textMuted}`}>
                        <User size={18} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${slot.servidora ? 'text-white' : COLORS.textMuted}`}>
                    {slot.servidora ? slot.servidora.nombre : "Disponible"}
                </p>
                <div className={`flex items-center gap-1 text-xs ${statusColor}`}>
                    <StatusIcon size={12} />
                    <span>{STATUS_CONFIG[slot.estado].label}</span>
                </div>
            </div>

            {/* Acciones (Visible en Hover o siempre si es vacante) */}
            <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-slate-700 text-slate-300 transition-opacity">
                <MoreHorizontal size={16} />
            </button>
        </div>
    );
};

const DayColumn = ({ date, slots, isActive }) => {
    const dayName = new Date(date).toLocaleDateString('es-ES', { weekday: 'long' });
    const dayNumber = new Date(date).getDate();

    if (!isActive) {
        return (
            <div className={`h-full p-4 border-r ${COLORS.border} opacity-30 bg-[#050c18]`}>
                <span className="text-xl font-bold text-slate-600">{dayNumber}</span>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col p-4 border-r ${COLORS.border} min-h-[200px]`}>
            <div className="flex items-baseline justify-between mb-4">
                <div>
                    <span className="block text-xs uppercase tracking-wider font-bold text-teal-500/80">{dayName}</span>
                    <span className="text-2xl font-bold text-white">{dayNumber}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                    2/2
                </span>
            </div>

            <div className="flex flex-col gap-3 flex-1">
                {slots.map((slot) => (
                    <SlotCard key={slot.id} slot={slot} />
                ))}
            </div>
        </div>
    );
};

const StaffSidebar = () => (
    <aside className={`w-80 border-l ${COLORS.border} ${COLORS.bg} flex flex-col`}>
        <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white mb-1">Personal</h2>
            <p className="text-xs text-slate-400">Arrastra para asignar</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mockServidoras.map((staff) => (
                <div
                    key={staff.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${COLORS.card} hover:bg-[#1d3557] cursor-grab active:cursor-grabbing border border-transparent hover:border-slate-600 transition-all`}
                >
                    <img src={staff.avatar} alt={staff.nombre} className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200">{staff.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            {staff.estado === 'disponible' && (
                                <span className="text-[10px] flex items-center gap-1 text-emerald-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Disponible
                                </span>
                            )}
                            {staff.estado === 'cumplido' && (
                                <span className="text-[10px] flex items-center gap-1 text-blue-400">
                                    <Calendar size={10} /> 1/1 Mes
                                </span>
                            )}
                            {staff.estado === 'extra' && (
                                <span className="text-[10px] flex items-center gap-1 text-amber-400">
                                    <AlertTriangle size={10} /> Extra
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </aside>
);

const CalendarGrid = () => {
    // Generación simplificada de la grilla
    // En una app real, esto sería lógica de fechas real
    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(2025, 10, i + 1);
        const dayOfWeek = d.getDay(); // 0 = Dom, 5 = Vie
        const isFridayOrSunday = dayOfWeek === 0 || dayOfWeek === 5;

        // Buscar turnos mockeados para este día
        const dateStr = d.toISOString().split('T')[0];
        const turno = mockTurnos.find(t => t.fecha === dateStr);

        return {
            date: d,
            isActive: isFridayOrSunday,
            slots: turno ? turno.slots : [
                { id: `empty-${i}-1`, estado: 'vacante', servidora: null },
                { id: `empty-${i}-2`, estado: 'vacante', servidora: null }
            ]
        };
    });

    return (
        <div className="flex-1 overflow-y-auto bg-[#0a192f]">
            <div className="grid grid-cols-7 auto-rows-fr min-h-full border-l border-t border-slate-800">
                {/* Headers Días */}
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-bold text-slate-500 uppercase border-b border-r border-slate-800 bg-[#0f203c]">
                        {day}
                    </div>
                ))}

                {/* Celdas */}
                {days.map((day, idx) => (
                    <div key={idx} className={`min-h-[180px] ${!day.isActive ? 'bg-[#050c18]' : ''}`}>
                        <DayColumn date={day.date} slots={day.slots} isActive={day.isActive} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN LAYOUT ---
export default function CunaDashboard() {
    return (
        <div className="flex h-screen w-full bg-[#0a192f] text-slate-200 font-sans overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <CalendarGrid />
            </div>

            {/* Right Sidebar */}
            <StaffSidebar />
        </div>
    );
}
