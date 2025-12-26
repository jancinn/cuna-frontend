-- SCRIPT MAESTRO DE REGLAS DE NEGOCIO ESTRICTAS
-- Ejecutar paso a paso en el SQL Editor de Supabase

-- PASO 1: LIMPIEZA DE "HUECOS" (Slots sin dueña)
-- Eliminar cualquier turno que no tenga trabajador asignado.
-- Esto cumple la regla: "Nunca deben existir slots vacíos".
DELETE FROM cuna_turnos 
WHERE trabajador_id IS NULL;

-- PASO 2: BLINDAJE DE ESTRUCTURA (Constraints)
-- 2.1 Hacer obligatorio el trabajador_id
ALTER TABLE cuna_turnos 
ALTER COLUMN trabajador_id SET NOT NULL;

-- 2.2 Asegurar unicidad de Slot por Fecha (Evitar 3er turno)
-- Nota: Asumimos que la columna de relación se llama 'cuna_calendario_id'. 
-- Si se llama diferente (ej: 'calendario_id'), por favor ajustar el nombre.
ALTER TABLE cuna_turnos
ADD CONSTRAINT unique_slot_per_date UNIQUE (cuna_calendario_id, slot_numero);

-- PASO 3: RESTRICCIÓN DE ESTADO (Check Constraint)
-- Asegurar que solo se pueda pedir cambio si hay trabajador (redundante con NOT NULL pero buena práctica)
-- y definir estados válidos.
ALTER TABLE cuna_turnos
ADD CONSTRAINT valid_states CHECK (estado IN ('asignado', 'confirmado', 'solicitud_cambio', 'liberado'));

-- PASO 4: CORRECCIÓN MANUAL (Ejemplo para el 2 de Enero)
-- Si aún existe el duplicado del 2 de Enero, esto lo limpia (ajustar IDs según necesidad real)
-- DELETE FROM cuna_turnos WHERE fecha = '2026-01-02' AND slot_numero = 2;
-- UPDATE cuna_turnos SET trabajador_id = 'ID_MARY', estado = 'asignado' WHERE fecha = '2026-01-02' AND slot_numero = 1;
