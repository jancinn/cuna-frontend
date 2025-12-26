import React from 'react';
import {
    Bell,
    Calendar,
    Clock,
    CheckCircle,
    AlertTriangle,
    MessageSquare,
    User,
    MapPin,
    ChevronRight
} from 'lucide-react';

// --- CONSTANTES DE ESTILO (Coherencia con Dashboard) ---
const COLORS = {
    bg: "bg-[#0a192f]", // Deep Navy
    card: "bg-[#112240]", // Light Navy
    cardHighlight: "bg-[#1d3557]",
    accent: "text-teal-300", // Soft Teal
    buttonPrimary: "bg-teal-600 hover:bg-teal-500 text-white",
    buttonSecondary: "bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800",
    textMain: "text-slate-200",
    textMuted: "text-slate-400",
};

// --- DATOS SIMULADOS (Contexto Servidora) ---
const mockMyNextShift = {
    id: "t-123",
    fecha: "Viernes, 14 Noviembre",
    hora: "19:00 - 21:00 hrs",
    lugar: "Sala Cuna 1",
    estado: "pendiente", // pendiente, confirmado, solicitud
    componera: {
        nombre: "Ana García",
        avatar: "https://i.pravatar.cc/150?u=1",
        rol: "Servidora"
    }
};

const mockFutureShifts = [
    { id: "t-124", fecha: "Dom, 23 Nov", estado: "confirmado" },
    { id: "t-125", fecha: "Vie, 05 Dic", estado: "pendiente" },
];

// --- COMPONENTES ---

const HeaderMobile = () => (
    <header className={`flex items-center justify-between p-5 ${COLORS.bg} sticky top-0 z-10 border-b border-slate-800`}>
        <div>
            <h1 className="text-xl font-bold text-white">Hola, Carla</h1>
            <p className={`text-xs ${COLORS.textMuted}`}>Servidora de Cuna</p>
        </div>

        <button className="relative p-2 rounded-full bg-[#112240] text-slate-200">
            <MessageSquare size={20} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                2
            </span>
        </button>
    </header>
);

const StatusBadge = ({ status }) => {
    if (status === 'confirmado') {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <CheckCircle size={14} />
                <span className="text-xs font-bold uppercase tracking-wide">Confirmado</span>
            </div>
        );
    }
    if (status === 'pendiente') {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock size={14} />
                <span className="text-xs font-bold uppercase tracking-wide">Pendiente de Confirmar</span>
            </div>
        );
    }
    return null;
};

const PartnerCard = ({ partner }) => (
    <div className="mt-6 p-4 rounded-xl bg-[#0a192f]/50 border border-slate-700/50 flex items-center gap-4">
        <img
            src={partner.avatar}
            alt={partner.nombre}
            className="w-12 h-12 rounded-full border-2 border-slate-600"
        />
        <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Tu Compañera</p>
            <p className="text-white font-medium">{partner.nombre}</p>
        </div>
    </div>
);

const NextShiftCard = ({ shift }) => (
    <div className={`rounded-2xl p-6 ${COLORS.card} shadow-lg shadow-black/20 border border-slate-700 relative overflow-hidden`}>
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-blue-600"></div>

        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-teal-400 mb-1">
                <Calendar size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Próximo Turno</span>
            </div>
            <StatusBadge status={shift.estado} />
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">{shift.fecha}</h2>

        <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-2 text-slate-300">
                <Clock size={16} className="text-slate-500" />
                <span>{shift.hora}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
                <MapPin size={16} className="text-slate-500" />
                <span>{shift.lugar}</span>
            </div>
        </div>

        <PartnerCard partner={shift.componera} />

        {/* Actions */}
        <div className="grid grid-cols-1 gap-3 mt-8">
            <button className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${COLORS.buttonPrimary}`}>
                <CheckCircle size={18} />
                Confirmar Asistencia
            </button>

            <button className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${COLORS.buttonSecondary}`}>
                <AlertTriangle size={18} />
                Solicitar Cambio
            </button>
        </div>
    </div>
);

const FutureShiftItem = ({ shift }) => (
    <div className={`flex items-center justify-between p-4 rounded-xl ${COLORS.card} border border-transparent hover:border-slate-700 transition-all`}>
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0a192f] text-slate-400">
                <Calendar size={18} />
            </div>
            <div>
                <p className="text-slate-200 font-medium">{shift.fecha}</p>
                <p className="text-xs text-slate-500">Turno Regular</p>
            </div>
        </div>
        {shift.estado === 'confirmado' ? (
            <CheckCircle size={16} className="text-teal-500" />
        ) : (
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
        )}
    </div>
);

// --- MAIN VIEW ---
export default function CunaServidoraView() {
    return (
        <div className={`min-h-screen w-full ${COLORS.bg} font-sans pb-20`}>
            <HeaderMobile />

            <main className="p-5 max-w-md mx-auto space-y-8">
                {/* Hero Section */}
                <section>
                    <NextShiftCard shift={mockMyNextShift} />
                </section>

                {/* Future Shifts Preview */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Próximamente</h3>
                        <button className="text-teal-400 text-xs font-bold flex items-center gap-1">
                            Ver Calendario <ChevronRight size={12} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {mockFutureShifts.map(shift => (
                            <FutureShiftItem key={shift.id} shift={shift} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
