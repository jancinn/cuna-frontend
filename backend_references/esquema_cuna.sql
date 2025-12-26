-- Esquema de Base de Datos para el Módulo Cuna (Versión Final Validada)

-- ==========================================
-- 1. ENUMS Y TIPOS
-- ==========================================
CREATE TYPE cuna_dia_tipo AS ENUM ('viernes', 'domingo');
CREATE TYPE cuna_estado_turno AS ENUM ('borrador', 'publicado', 'cerrado');
CREATE TYPE cuna_estado_asignacion AS ENUM ('asignado', 'confirmado', 'solicitud_cambio', 'cancelado');
CREATE TYPE cuna_contexto_mensaje AS ENUM ('turno', 'solicitud_cambio', 'general_administrativo');

-- ==========================================
-- 2. GESTIÓN DE PERSONAL (Sin duplicidad)
-- ==========================================
-- Esta tabla actúa como una "máscara" o "rol extendido" para el módulo Cuna.
-- No guarda nombres ni emails, solo vincula al usuario global con el contexto de Cuna.
CREATE TABLE cuna_servidoras (
    usuario_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    
    -- Metadatos específicos de Cuna (no del usuario global)
    notas_internas TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. CALENDARIO Y TURNOS
-- ==========================================
CREATE TABLE cuna_turnos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    tipo cuna_dia_tipo NOT NULL,
    estado cuna_estado_turno DEFAULT 'borrador',
    observaciones_publicas TEXT, -- Visible para las servidoras del turno
    observaciones_internas TEXT, -- Solo para la Responsable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validación estricta de días (5=Viernes, 0/7=Domingo según configuración DB)
    -- Se recomienda usar ISODOW donde 5=Viernes y 7=Domingo
    CONSTRAINT check_dia_valido CHECK (EXTRACT(ISODOW FROM fecha) IN (5, 7))
);

-- ==========================================
-- 4. ASIGNACIONES (La relación Servidora-Turno)
-- ==========================================
CREATE TABLE cuna_asignaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    turno_id UUID NOT NULL REFERENCES cuna_turnos(id) ON DELETE CASCADE,
    servidora_id UUID NOT NULL REFERENCES cuna_servidoras(usuario_id),
    
    -- Flag crítico para la regla de escasez
    es_asignacion_extra BOOLEAN DEFAULT false, 
    
    estado cuna_estado_asignacion DEFAULT 'asignado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Regla de unicidad: Una persona no puede estar duplicada en el mismo turno
    UNIQUE(turno_id, servidora_id)
);

-- ==========================================
-- 5. SISTEMA DE COMUNICACIÓN (Inbox Contextual)
-- ==========================================
CREATE TABLE cuna_conversaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Contexto Obligatorio
    contexto cuna_contexto_mensaje NOT NULL,
    referencia_id UUID, -- ID del Turno o Solicitud relacionada (Polimórfico lógico)
    
    -- Participantes (Siempre Servidora <-> Responsable)
    servidora_id UUID NOT NULL REFERENCES cuna_servidoras(usuario_id),
    
    asunto VARCHAR(150),
    estado VARCHAR(20) DEFAULT 'abierto', -- abierto, cerrado, archivado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cuna_mensajes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversacion_id UUID NOT NULL REFERENCES cuna_conversaciones(id) ON DELETE CASCADE,
    remitente_id UUID NOT NULL REFERENCES auth.users(id), -- Puede ser la Servidora o la Responsable
    contenido TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. AUDITORÍA Y BITÁCORA
-- ==========================================
CREATE TABLE cuna_bitacora (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha_evento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_id UUID REFERENCES auth.users(id), -- Actor del evento
    
    tipo_accion VARCHAR(50) NOT NULL, 
    -- Ejemplos: 'GENERACION_MES', 'ASIGNACION_EXTRA', 'MENSAJE_ENVIADO', 'CAMBIO_SOLICITADO'
    
    descripcion TEXT NOT NULL,
    
    -- Enlace opcional para trazabilidad rápida
    turno_relacionado_id UUID REFERENCES cuna_turnos(id) ON DELETE SET NULL,
    
    metadata JSONB -- Detalles técnicos (ej. { "motivo": "escasez_personal", "previo": "asignado" })
);

-- ==========================================
-- 7. ÍNDICES DE RENDIMIENTO
-- ==========================================
CREATE INDEX idx_cuna_turnos_fecha ON cuna_turnos(fecha);
CREATE INDEX idx_cuna_asignaciones_servidora ON cuna_asignaciones(servidora_id);
CREATE INDEX idx_cuna_mensajes_conversacion ON cuna_mensajes(conversacion_id);
CREATE INDEX idx_cuna_conversaciones_servidora ON cuna_conversaciones(servidora_id);
