import React, { useEffect, useState } from 'react';
import {
    Home,
    Calendar as CalendarIcon,
    Repeat,
    Settings,
    Clock,
    User,
    LogOut,
    ChevronRight,
    Loader2,
    AlertCircle,
    MessageSquare
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

// --- COMPONENTES UI ---

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active
            ? 'bg-teal-600 text-white'
            : 'text-slate-400 hover:bg-white/5 hover:text-teal-400'
            }`}
    >
        <Icon size={20} />
        {label}
    </button>
);

const ShiftCard = ({ shift, onRequestChange }) => {
    if (!shift) return null;

    const dateObj = new Date(shift.fecha + 'T00:00:00');
    const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });

    return (
        <div className="bg-[#112240] border border-slate-700/50 rounded-xl p-6 shadow-lg mb-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 capitalize">{dateStr}</h3>
                    <div className="flex items-center gap-2 text-slate-400 mt-1">
                        <Clock size={16} />
                        <span className="capitalize">{dayName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 mt-1">
                        <User size={16} />
                        <span>Con: {shift.companero || 'Por asignar'}</span>
                    </div>
                </div>
                <span className="bg-teal-900/30 text-teal-400 border border-teal-700/50 text-xs font-bold px-3 py-1 rounded-full">
                    Cuna (0-2)
                </span>
            </div>

            <button
                onClick={() => onRequestChange(shift.id)}
                className="w-full py-2.5 border border-slate-600 text-slate-300 font-medium rounded-lg hover:bg-white/5 transition-colors"
            >
                Solicitar cambio
            </button>
            <p className="text-xs text-slate-500 text-center mt-3 px-4">
                Al solicitar cambio, tu turno se publicará para que otras compañeras lo vean. Sigues siendo responsable hasta que alguien lo tome.
            </p>
        </div>
    );
};

// --- MINI CALENDAR COMPONENT ---
const MiniCalendar = ({ currentDate, events }) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayIndex = firstDay.getDay(); // 0 = Sunday

    // Ajustar para que lunes sea 0 (si se prefiere lunes como primer día)
    // En JS getDay(): 0=Sun, 1=Mon. Si queremos Mon=0, Sun=6:
    const adjustedStart = startingDayIndex === 0 ? 6 : startingDayIndex - 1;

    const days = [];
    // Relleno previo
    for (let i = 0; i < adjustedStart; i++) {
        days.push(null);
    }
    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const getDayStatus = (day) => {
        if (!day) return null;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events[dateStr]; // 'mine', 'available', etc.
    };

    return (
        <div className="bg-[#112240] border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-100 font-bold capitalize">{monthName}</h3>
                <div className="flex gap-3 text-[10px]">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                        <span className="text-slate-400">Tu turno</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-slate-400">Disponible</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-xs font-bold text-slate-500 py-1">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                    const status = getDayStatus(day);
                    let bgClass = 'hover:bg-white/5 text-slate-300';
                    let ringClass = '';

                    if (status === 'mine') {
                        bgClass = 'bg-teal-900/40 text-teal-400 font-bold';
                        ringClass = 'ring-1 ring-teal-500/50';
                    } else if (status === 'available') {
                        bgClass = 'bg-amber-900/20 text-amber-400 font-bold';
                        ringClass = 'ring-1 ring-amber-500/50 border-dashed border-amber-500';
                    } else if (!day) {
                        bgClass = 'invisible';
                    }

                    return (
                        <div
                            key={idx}
                            className={`
                                aspect-square flex items-center justify-center rounded-lg text-sm transition-all
                                ${bgClass} ${ringClass}
                            `}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ... (imports remain the same)

export default function CunaServidoraView() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [nextShifts, setNextShifts] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState({}); // { '2025-12-26': 'mine' }
    const [activeTab, setActiveTab] = useState('inicio');

    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                if (!supabase) throw new Error("Supabase client not initialized");

                // 1. Obtener usuario
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError) throw authError;
                if (!user) {
                    navigate('/login');
                    return;
                }

                // 2. Obtener perfil
                const { data: profile, error: profileError } = await supabase
                    .from('cuna_trabajadores')
                    .select('nombre, apellido, rol')
                    .eq('usuario_id', user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    // Ignoramos error si no encuentra perfil (PGRST116), usamos email
                    console.warn("Perfil no encontrado", profileError);
                }

                const userName = profile?.nombre
                    ? `${profile.nombre} ${profile.apellido || ''}`
                    : user.email.split('@')[0];

                setUserProfile({ ...profile, displayName: userName, id: user.id });

                // 3. Obtener calendario y turnos
                const today = new Date().toISOString().split('T')[0];
                const { data: calendarData, error: calendarError } = await supabase
                    .from('cuna_calendario')
                    .select(`
                        id,
                        fecha,
                        dia_semana,
                        cuna_turnos (
                            id,
                            slot_numero,
                            estado,
                            trabajador_id
                        )
                    `)
                    .gte('fecha', today)
                    .order('fecha', { ascending: true });

                if (calendarError) throw calendarError;

                // 4. Procesar datos
                const myShifts = [];
                const eventsMap = {};

                if (calendarData) {
                    calendarData.forEach(day => {
                        if (!day.cuna_turnos) return; // Skip si no hay turnos array

                        // Buscar mi turno
                        const myTurn = day.cuna_turnos.find(t => t.trabajador_id === user.id && (t.estado === 'asignado' || t.estado === 'confirmado'));

                        // Buscar oportunidades (solicitudes de cambio de otros)
                        const opportunity = day.cuna_turnos.find(t => t.estado === 'solicitud_cambio' && t.trabajador_id !== user.id);

                        if (myTurn) {
                            myShifts.push({
                                id: myTurn.id,
                                fecha: day.fecha,
                                companero: "Compañera de equipo"
                            });
                            eventsMap[day.fecha] = 'mine';
                        } else if (opportunity) {
                            eventsMap[day.fecha] = 'available';
                        }
                    });
                }

                setNextShifts(myShifts.slice(0, 2));
                setCalendarEvents(eventsMap);

            } catch (err) {
                console.error("CRITICAL ERROR:", err);
                setError(err.message || JSON.stringify(err));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    // ... (rest of handlers remain the same)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a192f]">
                <Loader2 className="animate-spin text-teal-500" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a192f] text-white p-8">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
                <p className="text-slate-400 mb-4 text-center max-w-md">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-teal-600 rounded-lg font-bold hover:bg-teal-500 transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a192f] flex font-sans text-slate-200">
            <ServidoraHeader />

            {/* SIDEBAR (Desktop only) */}
            <aside className="w-64 bg-[#112240] border-r border-slate-700/50 hidden md:flex flex-col fixed h-full">
                {/* ... (sidebar content remains the same) */}
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-xl">
                        <CalendarIcon size={24} />
                        <span>Módulo de Cuna</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <SidebarItem
                        icon={Home}
                        label="Inicio"
                        active={activeTab === 'inicio'}
                        onClick={() => setActiveTab('inicio')}
                    />
                    <SidebarItem
                        icon={CalendarIcon}
                        label="Calendario"
                        active={false}
                        onClick={() => navigate('/servidora/calendario')}
                    />
                    <SidebarItem
                        icon={Repeat}
                        label="Intercambios"
                        active={false}
                        onClick={() => navigate('/servidora/intercambios')}
                    />
                    <SidebarItem
                        icon={Settings}
                        label="Ajustes"
                        active={activeTab === 'ajustes'}
                        onClick={() => setActiveTab('ajustes')}
                    />
                    <SidebarItem
                        icon={MessageSquare}
                        label="Comunicación"
                        active={false}
                        onClick={() => navigate('/servidora/comunicacion')}
                    />
                </nav>

                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                            {userProfile?.displayName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-200 truncate">{userProfile?.displayName}</p>
                            <p className="text-xs text-slate-500 capitalize">{userProfile?.rol || 'Servidora'}</p>
                        </div>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
                <header className="mb-8 hidden md:block">
                    <h1 className="text-3xl font-bold text-slate-100">Bienvenido, {userProfile?.displayName}</h1>
                    <p className="text-slate-400 mt-1">Aquí está tu resumen de turnos y actividad reciente</p>
                </header>

                {/* Mobile Welcome */}
                <div className="md:hidden mb-6">
                    <h2 className="text-xl font-bold text-slate-100">Hola, {userProfile?.displayName?.split(' ')[0]}</h2>
                    <p className="text-xs text-slate-400">Resumen de actividad</p>
                </div>

                {/* ACCESOS RÁPIDOS (Mobile Only) */}
                <div className="grid grid-cols-3 gap-3 mb-8 md:hidden">
                    <button onClick={() => navigate('/servidora/calendario')} className="flex flex-col items-center justify-center p-3 bg-[#112240] border border-slate-700 rounded-xl shadow-sm active:scale-95 transition-transform">
                        <div className="w-10 h-10 bg-teal-900/30 text-teal-400 rounded-full flex items-center justify-center mb-2">
                            <CalendarIcon size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-300">Calendario</span>
                    </button>
                    <button onClick={() => navigate('/servidora/intercambios')} className="flex flex-col items-center justify-center p-3 bg-[#112240] border border-slate-700 rounded-xl shadow-sm active:scale-95 transition-transform">
                        <div className="w-10 h-10 bg-amber-900/30 text-amber-400 rounded-full flex items-center justify-center mb-2">
                            <Repeat size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-300">Intercambios</span>
                    </button>
                    <button onClick={() => navigate('/servidora/comunicacion')} className="flex flex-col items-center justify-center p-3 bg-[#112240] border border-slate-700 rounded-xl shadow-sm active:scale-95 transition-transform">
                        <div className="w-10 h-10 bg-purple-900/30 text-purple-400 rounded-full flex items-center justify-center mb-2">
                            <MessageSquare size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-300">Mensajes</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* COLUMNA IZQUIERDA: PRÓXIMOS TURNOS */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarIcon className="text-teal-400" size={20} />
                            <h2 className="text-lg font-bold text-slate-100">Mis próximos turnos</h2>
                        </div>

                        {nextShifts.length > 0 ? (
                            nextShifts.map(shift => (
                                <ShiftCard
                                    key={shift.id}
                                    shift={shift}
                                    onRequestChange={handleRequestChange}
                                />
                            ))
                        ) : (
                            <div className="bg-[#112240] border border-slate-700 rounded-xl p-8 text-center">
                                <div className="w-12 h-12 bg-teal-900/30 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle size={24} />
                                </div>
                                <h3 className="text-slate-100 font-bold">¡Todo despejado!</h3>
                                <p className="text-slate-500 text-sm mt-1">No tienes turnos asignados próximamente.</p>
                            </div>
                        )}
                    </section>

                    {/* COLUMNA DERECHA: CALENDARIO VISUAL */}
                    <section>
                        <h2 className="text-lg font-bold text-slate-100 mb-1">Tu mes en un vistazo</h2>
                        <p className="text-sm text-slate-500 mb-4">Puntos verdes son tus turnos, amarillos son oportunidades.</p>

                        <MiniCalendar
                            currentDate={new Date()}
                            events={calendarEvents}
                        />
                    </section>
                </div>
            </main>
        </div>
    );
}

// Icono auxiliar
function CheckCircle({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}
