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
                Si necesitas cambiar este turno, no te preocupes. Estamos aquí para apoyarte.
            </p>
        </div>
    );
};

const MonthCalendarItem = ({ date, dayName, year, isAssigned }) => (
    <div className="flex items-center justify-between p-4 border border-slate-700/50 rounded-lg hover:border-slate-600 transition-colors bg-[#112240]">
        <div>
            <p className="font-bold text-slate-200">{date}</p>
            <p className="text-xs text-slate-500 capitalize">{dayName}</p>
        </div>
        <div className="flex items-center gap-3">
            {isAssigned && (
                <span className="w-2 h-2 rounded-full bg-teal-500" title="Tu turno"></span>
            )}
            <span className="bg-slate-800 text-slate-400 text-xs font-medium px-2 py-1 rounded">
                0-2 años
            </span>
        </div>
    </div>
);

import ServidoraHeader from './ServidoraHeader';

// ... (imports remain the same)

export default function CunaServidoraView() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [nextShifts, setNextShifts] = useState([]);
    const [monthSchedule, setMonthSchedule] = useState([]);
    const [activeTab, setActiveTab] = useState('inicio');

    useEffect(() => {
        const loadData = async () => {
            try {
                if (!supabase) return;

                // 1. Obtener usuario
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate('/login');
                    return;
                }

                // 2. Obtener perfil
                const { data: profile } = await supabase
                    .from('cuna_trabajadores')
                    .select('nombre, apellido, rol')
                    .eq('usuario_id', user.id)
                    .single();

                const userName = profile?.nombre
                    ? `${profile.nombre} ${profile.apellido || ''}`
                    : user.email.split('@')[0];

                setUserProfile({ ...profile, displayName: userName, id: user.id });

                // 3. Obtener calendario y turnos
                // Traemos todo el calendario futuro
                const today = new Date().toISOString().split('T')[0];
                const { data: calendarData, error } = await supabase
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

                if (error) throw error;

                // 4. Procesar datos para la UI

                // A) Mis próximos turnos
                const myShifts = [];
                const scheduleList = [];

                // Necesitamos saber quién es el compañero en mis turnos
                // Para simplificar, haremos un fetch adicional de nombres si es necesario, 
                // o por ahora mostraremos "Compañero" genérico.
                // *Mejora futura: traer nombres de compañeros.*

                calendarData?.forEach(day => {
                    const dateObj = new Date(day.fecha + 'T00:00:00');
                    const dayNum = dateObj.getDate();
                    const monthShort = dateObj.toLocaleDateString('es-ES', { month: 'short' });
                    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });

                    // Buscar si tengo turno este día
                    const myTurn = day.cuna_turnos.find(t => t.trabajador_id === user.id && (t.estado === 'asignado' || t.estado === 'confirmado'));

                    if (myTurn) {
                        myShifts.push({
                            id: myTurn.id,
                            fecha: day.fecha,
                            companero: "Compañera de equipo" // Placeholder hasta hacer join complejo
                        });
                    }

                    // Construir lista calendario
                    scheduleList.push({
                        id: day.id,
                        date: `${dayNum} ${monthShort}`,
                        dayName: dayName,
                        fullDate: day.fecha,
                        isAssigned: !!myTurn
                    });
                });

                setNextShifts(myShifts.slice(0, 2)); // Solo los 2 siguientes
                setMonthSchedule(scheduleList.slice(0, 5)); // Próximos 5 eventos en lista

            } catch (err) {
                console.error("Error cargando datos:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    const handleRequestChange = async (shiftId) => {
        if (!confirm('¿Confirmas que deseas solicitar un cambio para este turno?')) return;

        try {
            const { error } = await supabase
                .from('cuna_turnos')
                .update({ estado: 'solicitud_cambio' })
                .eq('id', shiftId);

            if (error) throw error;
            alert('Solicitud enviada correctamente.');
            window.location.reload(); // Recarga simple para actualizar estado
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a192f]">
                <Loader2 className="animate-spin text-teal-500" size={32} />
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

                    {/* COLUMNA DERECHA: CALENDARIO DEL MES */}
                    <section>
                        <h2 className="text-lg font-bold text-slate-100 mb-1">Calendario del mes</h2>
                        <p className="text-sm text-slate-500 mb-4">Tus fechas destacadas este mes</p>

                        <div className="bg-[#112240] border border-slate-700/50 rounded-xl p-4 space-y-3">
                            {monthSchedule.length > 0 ? (
                                monthSchedule.map(item => (
                                    <MonthCalendarItem
                                        key={item.id}
                                        date={item.date}
                                        dayName={item.dayName}
                                        isAssigned={item.isAssigned}
                                    />
                                ))
                            ) : (
                                <p className="text-center text-slate-500 py-4">No hay fechas programadas.</p>
                            )}
                        </div>
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
