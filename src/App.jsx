import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './components/Login';
import DebugAuth from './components/DebugAuth';
import CunaDashboard from './components/CunaDashboard';
import CunaServidoraView from './components/CunaServidoraView';

import CunaServidoras from './components/CunaServidoras';

function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a192f] text-white gap-8">
      <h1 className="text-4xl font-bold text-teal-400">Módulo Cuna (Independiente)</h1>
      <div className="flex gap-6">
        <Link to="/dashboard" className="px-6 py-3 bg-teal-600 rounded-lg font-bold hover:bg-teal-500 transition">
          Ver como Responsable
        </Link>
        <Link to="/servidora" className="px-6 py-3 border border-teal-600 rounded-lg font-bold hover:bg-teal-900/30 transition">
          Ver como Servidora
        </Link>
      </div>
    </div>
  );
}

import AdminLayout from './components/AdminLayout';
import CunaAsignaciones from './components/CunaAsignaciones';
import CunaReportes from './components/CunaReportes';
import CunaComunicacion from './components/CunaComunicacion';
import CunaIntercambiosServidora from './components/CunaIntercambiosServidora';
import CunaCalendarioServidora from './components/CunaCalendarioServidora';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/debug-auth" element={<DebugAuth />} />

        {/* Defensive Route for Typo */}
        <Route path="/dasboard" element={<Navigate to="/dashboard" replace />} />

        {/* Rutas de Administradora (con Sidebar) */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<CunaDashboard />} />
          <Route path="/asignaciones" element={<CunaAsignaciones />} />
          <Route path="/servidoras" element={<CunaServidoras />} />
          <Route path="/reportes" element={<CunaReportes />} />
          <Route path="/comunicacion" element={<CunaComunicacion />} />
        </Route>

        {/* Rutas de Servidora (Vista Simple) */}
        <Route path="/servidora" element={<CunaServidoraView />} />
        <Route path="/servidora/comunicacion" element={<CunaComunicacion />} />
        <Route path="/servidora/intercambios" element={<CunaIntercambiosServidora />} />
        <Route path="/servidora/calendario" element={<CunaCalendarioServidora />} />
      </Routes>
    </Router>
  );
}

export default App;
