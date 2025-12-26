-- Agregar columna para rastrear quién era la dueña anterior del turno
-- Esto permite mostrar "Intercambio Exitoso" en el panel de la persona que lo soltó.

ALTER TABLE cuna_turnos 
ADD COLUMN trabajador_anterior_id UUID REFERENCES auth.users(id);

-- Opcional: Crear un índice para búsquedas rápidas si la tabla crece mucho
CREATE INDEX idx_cuna_turnos_trabajador_anterior ON cuna_turnos(trabajador_anterior_id);
