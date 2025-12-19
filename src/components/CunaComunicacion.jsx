import React from 'react';
import { useLocation } from 'react-router-dom';
import ServidoraHeader from './ServidoraHeader';

export default function CunaComunicacion() {
    const location = useLocation();
    const isServidoraView = location.pathname.startsWith('/servidora');

    return (
        <div className={`p-8 text-white ${isServidoraView ? 'pt-20 md:pt-8 bg-slate-50 text-slate-900' : ''}`}>
            {isServidoraView && <ServidoraHeader />}
            <h1 className="text-2xl font-bold mb-4">Comunicación</h1>
            <p className={isServidoraView ? "text-slate-500" : "text-slate-400"}>
                Bandeja de entrada y mensajes (En construcción).
            </p>
        </div>
    );
}
