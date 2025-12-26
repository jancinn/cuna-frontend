-- Agregar columnas para gestión de identidad en cuna_trabajadores
ALTER TABLE cuna_trabajadores
ADD COLUMN IF NOT EXISTS nombre VARCHAR(100),
ADD COLUMN IF NOT EXISTS apellido VARCHAR(100),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Comentario: Ahora la identidad puede vivir en la tabla, no solo en metadata.
