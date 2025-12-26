-- Trigger para registrar cambios en cuna_turnos automáticamente en cuna_bitacora
CREATE OR REPLACE FUNCTION log_cuna_turnos_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.estado <> NEW.estado) OR (OLD.trabajador_id IS DISTINCT FROM NEW.trabajador_id) THEN
            INSERT INTO cuna_bitacora (actor_id, accion)
            VALUES (
                auth.uid(), 
                'Turno ' || NEW.id || ' actualizado. Estado: ' || OLD.estado || ' -> ' || NEW.estado || '. Trabajador: ' || COALESCE(OLD.trabajador_id::text, 'NULL') || ' -> ' || COALESCE(NEW.trabajador_id::text, 'NULL')
            );
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
         INSERT INTO cuna_bitacora (actor_id, accion)
            VALUES (
                auth.uid(), 
                'Turno ' || NEW.id || ' creado. Estado: ' || NEW.estado
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_cuna_turnos_change ON cuna_turnos;
CREATE TRIGGER on_cuna_turnos_change
AFTER INSERT OR UPDATE ON cuna_turnos
FOR EACH ROW EXECUTE FUNCTION log_cuna_turnos_changes();
