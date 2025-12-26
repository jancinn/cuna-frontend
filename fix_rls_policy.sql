-- INTENTO 2: Versión simplificada
-- Si esto falla, por favor verifica que estás en el proyecto de Supabase correcto.
-- La tabla DEBE llamarse 'cuna_turnos' porque así la usa la aplicación.

CREATE POLICY "Permitir tomar turnos en intercambio" ON cuna_turnos
FOR UPDATE 
TO authenticated
USING (
  estado = 'solicitud_cambio'
) 
WITH CHECK (
  trabajador_id = auth.uid() AND
  estado = 'asignado'
);

-- Asegurarse de que RLS está habilitado
ALTER TABLE cuna_turnos ENABLE ROW LEVEL SECURITY;
