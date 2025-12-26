-- ==========================================
-- POLÍTICAS DE SEGURIDAD (RLS) - MÓDULO CUNA (CORREGIDO Y SEGURO)
-- ==========================================

-- Habilitar RLS explícitamente
ALTER TABLE cuna_trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuna_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuna_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuna_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuna_bitacora ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 1. TABLA: CUNA_TRABAJADORES
-- ==========================================

-- Responsable: Acceso total
DROP POLICY IF EXISTS "Responsable gestiona trabajadores" ON cuna_trabajadores;
CREATE POLICY "Responsable gestiona trabajadores" ON cuna_trabajadores
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'responsable'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'responsable'
        )
    );

-- Servidora: Solo ve su propio perfil
DROP POLICY IF EXISTS "Servidora ve su perfil" ON cuna_trabajadores;
CREATE POLICY "Servidora ve su perfil" ON cuna_trabajadores
    FOR SELECT
    USING (usuario_id = auth.uid());

-- ==========================================
-- 2. TABLA: CUNA_CALENDARIO
-- ==========================================

-- Responsable: Acceso total
DROP POLICY IF EXISTS "Responsable gestiona calendario" ON cuna_calendario;
CREATE POLICY "Responsable gestiona calendario" ON cuna_calendario
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'responsable'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'responsable'
        )
    );

-- Servidora: Solo lectura
DROP POLICY IF EXISTS "Servidora ve calendario" ON cuna_calendario;
CREATE POLICY "Servidora ve calendario" ON cuna_calendario
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'servidora'
        )
    );

-- ==========================================
-- 3. TABLA: CUNA_TURNOS
-- ==========================================

-- Responsable: Acceso total
DROP POLICY IF EXISTS "Responsable gestiona turnos" ON cuna_turnos;
CREATE POLICY "Responsable gestiona turnos" ON cuna_turnos
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'responsable'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'responsable'
        )
    );

-- Servidora: Ver todos los turnos
DROP POLICY IF EXISTS "Servidora ve turnos" ON cuna_turnos;
CREATE POLICY "Servidora ve turnos" ON cuna_turnos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'servidora'
        )
    );

-- Servidora: Modificar turnos (Tomar vacante o gestionar propio)
DROP POLICY IF EXISTS "Servidora modifica turnos propios o vacantes" ON cuna_turnos;
CREATE POLICY "Servidora modifica turnos propios o vacantes" ON cuna_turnos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'servidora'
        )
        AND
        (trabajador_id IS NULL OR trabajador_id = auth.uid())
    )
    WITH CHECK (
        (trabajador_id IS NULL OR trabajador_id = auth.uid())
    );

-- Servidora: Insertar turnos (Tomar slots libres)
DROP POLICY IF EXISTS "Servidora inserta turnos propios" ON cuna_turnos;
CREATE POLICY "Servidora inserta turnos propios" ON cuna_turnos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'servidora'
        )
        AND
        trabajador_id = auth.uid()
    );

-- ==========================================
-- 4. TABLA: CUNA_INBOX
-- ==========================================

-- Responsable: Acceso total
DROP POLICY IF EXISTS "Responsable gestiona inbox" ON cuna_inbox;
CREATE POLICY "Responsable gestiona inbox" ON cuna_inbox
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'responsable'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'responsable'
        )
    );

-- Servidora: Ver mensajes propios
DROP POLICY IF EXISTS "Servidora ve sus mensajes" ON cuna_inbox;
CREATE POLICY "Servidora ve sus mensajes" ON cuna_inbox
    FOR SELECT
    USING (
        (remitente_id = auth.uid() OR destinatario_id = auth.uid())
        AND
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'servidora'
        )
    );

-- Servidora: Enviar mensajes
DROP POLICY IF EXISTS "Servidora envia mensajes" ON cuna_inbox;
CREATE POLICY "Servidora envia mensajes" ON cuna_inbox
    FOR INSERT
    WITH CHECK (
        remitente_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'servidora'
        )
    );

-- ==========================================
-- 5. TABLA: CUNA_BITACORA
-- ==========================================

-- Responsable: Acceso total
DROP POLICY IF EXISTS "Responsable ve bitacora" ON cuna_bitacora;
CREATE POLICY "Responsable ve bitacora" ON cuna_bitacora
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'responsable'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cuna_trabajadores 
            WHERE usuario_id = auth.uid() AND rol = 'responsable'
        )
    );
