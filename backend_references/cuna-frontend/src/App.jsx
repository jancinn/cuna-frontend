import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import DebugAuth from './components/DebugAuth';

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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/debug-auth" element={<DebugAuth />} />
      </Routes>
    </Router>
  );
}

export default App;
