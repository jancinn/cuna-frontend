-- ==========================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- MÓDULO CUNA
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE cuna_servidoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuna_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuna_asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuna_conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuna_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuna_bitacora ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- DEFINICIÓN DE ROLES (Funciones Helper)
-- ==========================================
-- Asumimos que existe una forma de determinar si el usuario actual es "Responsable de Cuna".
-- Esto puede ser mediante un claim en el JWT o consultando una tabla de roles central.
-- Para este diseño, usaremos una función placeholder que deberás ajustar a tu sistema de roles real.

CREATE OR REPLACE FUNCTION is_responsable_cuna()
RETURNS BOOLEAN AS $$
BEGIN
  -- Lógica: Verificar si el usuario tiene rol 'admin' o 'responsable_cuna'
  -- Ejemplo: RETURN (auth.jwt() ->> 'role') = 'responsable_cuna';
  -- Por ahora, retornamos false para obligar a definir esto.
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'responsable_cuna')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 1. TABLA: CUNA_SERVIDORAS
-- ==========================================
-- Responsable: Puede ver y editar todo el padrón.
CREATE POLICY "Responsable gestiona servidoras" ON cuna_servidoras
    FOR ALL
    USING (is_responsable_cuna());

-- Servidora: Solo puede ver su propio registro (para saber si está activa).
CREATE POLICY "Servidora ve su propio perfil" ON cuna_servidoras
    FOR SELECT
    USING (auth.uid() = usuario_id);

-- ==========================================
-- 2. TABLA: CUNA_TURNOS
-- ==========================================
-- Responsable: Control total.
CREATE POLICY "Responsable gestiona turnos" ON cuna_turnos
    FOR ALL
    USING (is_responsable_cuna());

-- Servidora: Puede ver turnos publicados (para saber fechas disponibles o asignadas).
-- NO puede ver borradores.
CREATE POLICY "Servidoras ven turnos publicados" ON cuna_turnos
    FOR SELECT
    USING (
        estado = 'publicado' OR 
        estado = 'cerrado'
    );

-- ==========================================
-- 3. TABLA: CUNA_ASIGNACIONES
-- ==========================================
-- Responsable: Control total.
CREATE POLICY "Responsable gestiona asignaciones" ON cuna_asignaciones
    FOR ALL
    USING (is_responsable_cuna());

-- Servidora:
-- A) Puede ver SUS propias asignaciones.
CREATE POLICY "Servidora ve sus asignaciones" ON cuna_asignaciones
    FOR SELECT
    USING (auth.uid() = servidora_id);

-- B) Puede ver asignaciones de OTROS en turnos donde ELLA también sirve?
-- (Comúnmente útil para saber con quién le toca servir).
-- Si esto es deseado:
-- CREATE POLICY "Servidora ve compañeras de turno" ON cuna_asignaciones
-- FOR SELECT
-- USING (
--   turno_id IN (
--     SELECT turno_id FROM cuna_asignaciones WHERE servidora_id = auth.uid()
--   )
-- );

-- ==========================================
-- 4. TABLA: CUNA_CONVERSACIONES (Inbox)
-- ==========================================
-- Regla de Oro: Verticalidad.
-- Solo acceden: La dueña de la conversación (Servidora) y la Responsable.

-- Responsable: Ve todas las conversaciones.
CREATE POLICY "Responsable ve todo el inbox" ON cuna_conversaciones
    FOR ALL
    USING (is_responsable_cuna());

-- Servidora: Solo ve conversaciones donde ella es la participante.
CREATE POLICY "Servidora ve sus conversaciones" ON cuna_conversaciones
    FOR ALL
    USING (auth.uid() = servidora_id);

-- ==========================================
-- 5. TABLA: CUNA_MENSAJES
-- ==========================================
-- Hereda la seguridad de la conversación padre.

-- Responsable: Ve todos los mensajes.
CREATE POLICY "Responsable ve todos los mensajes" ON cuna_mensajes
    FOR ALL
    USING (is_responsable_cuna());

-- Servidora: Ve mensajes de SUS conversaciones.
CREATE POLICY "Servidora ve sus mensajes" ON cuna_mensajes
    FOR ALL
    USING (
        conversacion_id IN (
            SELECT id FROM cuna_conversaciones WHERE servidora_id = auth.uid()
        )
    );

-- Nota: Para INSERT, se debe validar que el remitente sea el auth.uid()
CREATE POLICY "Usuarios envían mensajes propios" ON cuna_mensajes
    FOR INSERT
    WITH CHECK (
        auth.uid() = remitente_id AND
        (
            -- Es responsable
            is_responsable_cuna() 
            OR 
            -- O es la dueña de la conversación
            conversacion_id IN (
                SELECT id FROM cuna_conversaciones WHERE servidora_id = auth.uid()
            )
        )
    );

-- ==========================================
-- 6. TABLA: CUNA_BITACORA
-- ==========================================
-- Responsable: Ve toda la bitácora.
CREATE POLICY "Responsable ve bitácora" ON cuna_bitacora
    FOR SELECT
    USING (is_responsable_cuna());

-- Servidora: NO tiene acceso a la bitácora general.
-- (Salvo que se requiera que vea su propio historial de acciones, pero por diseño lógico es herramienta de supervisión).
