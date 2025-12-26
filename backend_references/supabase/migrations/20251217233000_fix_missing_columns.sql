-- Agregar columna disponible_viernes a cuna_trabajadores
ALTER TABLE cuna_trabajadores 
ADD COLUMN IF NOT EXISTS disponible_viernes BOOLEAN DEFAULT true;

-- Agregar columnas nombre y apellido para persistencia de datos personales
ALTER TABLE cuna_trabajadores
ADD COLUMN IF NOT EXISTS nombre VARCHAR(100),
ADD COLUMN IF NOT EXISTS apellido VARCHAR(100);
