-- Función segura para obtener el rol del usuario actual sin recurrencia de RLS
CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con permisos de admin, ignorando RLS
AS $$
BEGIN
  RETURN (
    SELECT rol 
    FROM public.cuna_trabajadores 
    WHERE usuario_id = auth.uid()
  );
END;
$$;

-- ==========================================
-- REPARACIÓN DE POLÍTICAS (RLS)
-- ==========================================

-- 1. CUNA_CALENDARIO
DROP POLICY IF EXISTS "Servidora ve calendario" ON cuna_calendario;
CREATE POLICY "Servidora ve calendario" ON cuna_calendario
    FOR SELECT
    USING (
        public.get_my_rol() = 'servidora' OR public.get_my_rol() = 'responsable'
    );

-- 2. CUNA_TURNOS
DROP POLICY IF EXISTS "Servidora ve turnos" ON cuna_turnos;
CREATE POLICY "Servidora ve turnos" ON cuna_turnos
    FOR SELECT
    USING (
        public.get_my_rol() = 'servidora' OR public.get_my_rol() = 'responsable'
    );

-- 3. CUNA_TRABAJADORES
-- Asegurar que la servidora pueda leer su propio perfil (necesario para get_my_rol si no fuera security definer, pero buena práctica)
DROP POLICY IF EXISTS "Servidora ve su perfil" ON cuna_trabajadores;
CREATE POLICY "Servidora ve su perfil" ON cuna_trabajadores
    FOR SELECT
    USING (
        usuario_id = auth.uid()
    );
