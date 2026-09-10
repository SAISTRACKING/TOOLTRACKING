-- =========================================================
-- PROYECTO: ToolTracking (Control de Herramientas y Préstamos)
-- AUTORES: Jeime Jiménez & Rhonis Julio
-- FECHA: Septiembre 2026
-- BASE DE DATOS: PostgreSQL / Supabase
-- =========================================================

-- 1. TABLA: EMPLEADOS
-- Guarda los operarios y la cuadrilla a la que pertenecen.
CREATE TABLE IF NOT EXISTS empleados (
    nombre TEXT PRIMARY KEY,
    cuadrilla INT NOT NULL
);

-- 2. TABLA: HERRAMIENTAS
-- Catálogo de herramientas con llave foránea apuntando al empleado que la tiene prestada.
CREATE TABLE IF NOT EXISTS herramientas (
    id INT PRIMARY KEY,
    nombre TEXT NOT NULL,
    estado TEXT DEFAULT 'Disponible',
    prestada_a TEXT REFERENCES empleados(nombre) ON DELETE SET NULL,
    fecha_salida TIMESTAMPTZ,
    fecha_devolucion TIMESTAMPTZ
);

-- 3. PERMISOS / SEGURIDAD
-- Desactivar RLS para permitir lectura y escritura desde la aplicación web
ALTER TABLE empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE herramientas DISABLE ROW LEVEL SECURITY;

-- 4. DATOS INICIALES DE PRUEBA (SEED DATA)
-- Inserción de empleados en sus respectivas cuadrillas
INSERT INTO empleados (nombre, cuadrilla) VALUES
('jeime jimenez', 1),
('rhonis julio', 2),
('carlos perez', 1),
('mario ruiz', 3)
ON CONFLICT (nombre) DO NOTHING;

-- Inserción de herramientas de prueba
INSERT INTO herramientas (id, nombre, estado, prestada_a, fecha_salida, fecha_devolucion) VALUES
(101, 'Taladro Percutor', 'Disponible', NULL, NULL, NULL),
(102, 'Micrometro Digital', 'Disponible', NULL, NULL, NULL),
(103, 'Fumigadora Industrial', 'Disponible', NULL, NULL, NULL),
(104, 'Martillo Hilti TE 2000', 'Disponible', NULL, NULL, NULL),
(105, 'Llave Torx 8mm', 'Disponible', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
