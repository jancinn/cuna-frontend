
-- CORRECCIONES CRÍTICAS PARA EL MÓDULO CUNA

-- 1. Solucionar error de longitud en la bitácora (Error: value too long...)
ALTER TABLE cuna_bitacora ALTER COLUMN accion TYPE TEXT;

-- 2. Agregar columna 'habilitado' al calendario (Faltaba y causaba que no se vieran los días)
ALTER TABLE cuna_calendario ADD COLUMN IF NOT EXISTS habilitado BOOLEAN DEFAULT true;

-- 3. Asegurar que las servidoras tengan la columna de disponibilidad (por si acaso)
ALTER TABLE cuna_trabajadores ADD COLUMN IF NOT EXISTS disponible_viernes BOOLEAN DEFAULT false;

-- Confirmación
COMMENT ON COLUMN cuna_bitacora.accion IS 'Columna ampliada a TEXT';
COMMENT ON COLUMN cuna_calendario.habilitado IS 'Controla si el día es visible/usable';
