
-- Solución al error "value too long for type character varying(100)"
-- El problema es que el mensaje de auditoría (bitácora) es más largo de lo que permite la columna 'accion'.

-- Paso 1: Ampliar la columna 'accion' para permitir texto ilimitado o muy largo.
ALTER TABLE cuna_bitacora ALTER COLUMN accion TYPE TEXT;

-- Confirmación
COMMENT ON COLUMN cuna_bitacora.accion IS 'Columna ampliada a TEXT para evitar errores de longitud en logs automáticos';
