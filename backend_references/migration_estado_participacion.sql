-- Agregar columna para estado de participación (separado de activo/inactivo del sistema)
ALTER TABLE cuna_trabajadores 
ADD COLUMN estado_participacion TEXT DEFAULT 'activa';

-- Comentario:
-- activo (BOOLEAN): Controla acceso al sistema (Login).
-- estado_participacion (TEXT): Controla elegibilidad para turnos ('activa', 'descanso', 'suspendida').
-- La ⭐ (disponible_viernes) es ortogonal a esto.
