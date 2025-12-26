-- TABLA: Trabajadores (Servidoras y Responsables)
CREATE TABLE cuna_trabajadores (
    usuario_id UUID PRIMARY KEY REFERENCES auth.users(id),
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('responsable', 'servidora')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: Calendario Operativo (Viernes y Domingos)
CREATE TABLE cuna_calendario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    dia_semana VARCHAR(10) NOT NULL CHECK (dia_semana IN ('viernes', 'domingo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: Asignaciones (Slots fijos 1 y 2)
CREATE TABLE cuna_turnos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calendario_id UUID NOT NULL REFERENCES cuna_calendario(id),
    slot_numero INTEGER NOT NULL CHECK (slot_numero IN (1, 2)),
    trabajador_id UUID REFERENCES cuna_trabajadores(usuario_id), -- Puede ser NULL si está vacante/liberado
    estado VARCHAR(20) DEFAULT 'asignado' CHECK (estado IN ('asignado', 'confirmado', 'solicitud_cambio', 'liberado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(calendario_id, slot_numero)
);

-- TABLA: Inbox (Mensajes Directos)
CREATE TABLE cuna_inbox (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    remitente_id UUID NOT NULL REFERENCES auth.users(id),
    destinatario_id UUID NOT NULL REFERENCES auth.users(id),
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: Bitácora Simple
CREATE TABLE cuna_bitacora (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actor_id UUID REFERENCES auth.users(id),
    accion VARCHAR(100) NOT NULL
);
