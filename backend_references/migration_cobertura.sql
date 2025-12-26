-- Agregar columna para cobertura
ALTER TABLE cuna_turnos 
ADD COLUMN trabajador_cobertura_id UUID REFERENCES cuna_trabajadores(usuario_id);

-- Comentario:
-- trabajador_id: Es el TITULAR del turno (dueño original por rotación).
-- trabajador_cobertura_id: Es quien CUBRE el turno temporalmente.
-- Si trabajador_cobertura_id es NULL, el titular hace el turno.
-- Si tiene valor, esa persona hace el turno, pero el titular sigue siendo el dueño para efectos de rotación futura.
