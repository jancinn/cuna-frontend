-- Agregar columna para disponibilidad de viernes
-- Por defecto FALSE (restrictivo: solo domingos)
ALTER TABLE cuna_trabajadores 
ADD COLUMN IF NOT EXISTS disponible_viernes BOOLEAN DEFAULT false;

-- Comentario: Los trabajadores de viernes son un subconjunto.
-- Si disponible_viernes = true, puede tomar viernes y domingos.
-- Si disponible_viernes = false, solo puede tomar domingos.
