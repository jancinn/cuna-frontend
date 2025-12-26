-- Agregar columna habilitado a cuna_calendario
ALTER TABLE cuna_calendario 
ADD COLUMN IF NOT EXISTS habilitado BOOLEAN DEFAULT true;
