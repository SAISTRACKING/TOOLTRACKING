-- =========================================================
-- ToolTracking - Esquema de Base de Datos (PostgreSQL / Supabase)
-- Autores: Jeime Jiménez & Rhonis Julio
-- Incluye: Cifrado Criptográfico (SHA-256), Trazabilidad y RLS
-- =========================================================

-- Extensión criptográfica (opcional en Supabase/PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABLA: Empleados (Operarios de Cuadrillas)
CREATE TABLE IF NOT EXISTS empleados (
    nombre TEXT PRIMARY KEY,
    cuadrilla INT NOT NULL
);

-- 2. TABLA: Herramientas (Inventario Principal)
CREATE TABLE IF NOT EXISTS herramientas (
    id INT PRIMARY KEY,
    nombre TEXT NOT NULL,
    estado TEXT DEFAULT 'Disponible',
    prestada_a TEXT REFERENCES empleados(nombre) ON DELETE SET NULL,
    fecha_salida TIMESTAMPTZ,
    fecha_devolucion TIMESTAMPTZ
);

-- 3. TABLA: Usuarios del Sistema (Contraseñas Encriptadas con Hash SHA-256)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Hash SHA-256 hexadecimal de 64 caracteres
    rol TEXT DEFAULT 'Operador de Bodega'
);

-- 4. TABLA: Trazabilidad y Auditoría de Movimientos
-- Registra cada evento (Préstamo, Devolución, Alta, Modificación, Baja)
CREATE TABLE IF NOT EXISTS trazabilidad (
    id SERIAL PRIMARY KEY,
    herramienta_id INT NOT NULL,
    herramienta_nombre TEXT NOT NULL,
    tipo_movimiento TEXT NOT NULL, -- 'PRESTAMO', 'DEVOLUCION', 'REGISTRO', 'MODIFICACION', 'ELIMINACION'
    operario TEXT,
    cuadrilla INT,
    usuario_sistema TEXT NOT NULL, -- Supervisor / usuario que autorizó el movimiento
    fecha_hora TIMESTAMPTZ DEFAULT NOW(),
    observaciones TEXT
);

-- =========================================================
-- Políticas de Seguridad a Nivel de Fila (Row Level Security - RLS)
-- =========================================================
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE trazabilidad ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo herramientas" ON herramientas;
CREATE POLICY "Permitir todo herramientas" ON herramientas FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo empleados" ON empleados;
CREATE POLICY "Permitir todo empleados" ON empleados FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo usuarios" ON usuarios;
CREATE POLICY "Permitir todo usuarios" ON usuarios FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo trazabilidad" ON trazabilidad;
CREATE POLICY "Permitir todo trazabilidad" ON trazabilidad FOR ALL TO public USING (true) WITH CHECK (true);

-- Otorgar permisos a roles de Supabase (anon, authenticated, service_role)
GRANT ALL ON TABLE herramientas TO anon, authenticated, service_role;
GRANT ALL ON TABLE empleados TO anon, authenticated, service_role;
GRANT ALL ON TABLE usuarios TO anon, authenticated, service_role;
GRANT ALL ON TABLE trazabilidad TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- =========================================================
-- Datos Iniciales: Empleados
-- =========================================================
INSERT INTO empleados (nombre, cuadrilla) VALUES
('jeime jimenez', 1),
('rhonis julio', 2),
('carlos perez', 1),
('mario ruiz', 3),
('andres gomez', 2),
('felipe mendoza', 4)
ON CONFLICT (nombre) DO NOTHING;

-- =========================================================
-- Datos Iniciales: Usuarios con Contraseñas Encriptadas (SHA-256)
-- admin123 -> 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- 123456   -> 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
-- =========================================================
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Administrador General', 'admin@tooltracking.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Administrador General'),
('Jeime Jiménez', 'jeime@tooltracking.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'Supervisor de Bodega'),
('Rhonis Julio', 'rhonis@tooltracking.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'Supervisor de Bodega')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- =========================================================
-- Datos Iniciales: Herramientas del Inventario
-- =========================================================
INSERT INTO herramientas (id, nombre, estado, prestada_a, fecha_salida, fecha_devolucion) VALUES
(101, 'Taladro Percutor Bosch 650W', 'Disponible', NULL, NULL, NULL),
(102, 'Micrómetro Digital Mitutoyo 0-25mm', 'Disponible', NULL, NULL, NULL),
(103, 'Fumigadora Industrial Manual 16L', 'Disponible', NULL, NULL, NULL),
(104, 'Martillo Demoledor Hilti TE 2000', 'Disponible', NULL, NULL, NULL),
(105, 'Juego Llaves Torx T10-T50', 'Disponible', NULL, NULL, NULL),
(106, 'Amoladora Angular DeWalt 4-1/2"', 'Disponible', NULL, NULL, NULL),
(107, 'Nivel Láser Autonivelante 360°', 'Disponible', NULL, NULL, NULL),
(108, 'Torquímetro de Trueno 1/2" 10-150 ft-lb', 'Disponible', NULL, NULL, NULL),
(109, 'Calibrador Vernier Digital 6 Pulgadas', 'Disponible', NULL, NULL, NULL),
(110, 'Sierra Circular Milwaukee 7-1/4"', 'Disponible', NULL, NULL, NULL),
(111, 'Multímetro Digital Automotriz Fluke 115', 'Disponible', NULL, NULL, NULL),
(112, 'Calibrador vernier', 'Disponible', NULL, NULL, NULL),
(113, 'Juego de Llaves Bristol Métricas 1.5-10mm', 'Disponible', NULL, NULL, NULL),
(114, 'Radiometro Spectroline DM-365XA', 'Disponible', NULL, NULL, NULL),
(115, 'Yugo magnético articulado B100', 'Disponible', NULL, NULL, NULL),
(116, 'Remachadora Neumática Profesional', 'Disponible', NULL, NULL, NULL),
(117, 'Llave de Impacto Inalámbrica 1/2"', 'Disponible', NULL, NULL, NULL),
(118, 'Cizalla Cortapernos 24 Pulgadas', 'Disponible', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- Datos Iniciales: Historial de Trazabilidad
-- =========================================================
INSERT INTO trazabilidad (herramienta_id, herramienta_nombre, tipo_movimiento, operario, cuadrilla, usuario_sistema, fecha_hora, observaciones) VALUES
(101, 'Taladro Percutor Bosch 650W', 'REGISTRO', NULL, NULL, 'Administrador General', NOW() - INTERVAL '5 days', 'Ingreso inicial a inventario de bodega'),
(104, 'Martillo Demoledor Hilti TE 2000', 'PRESTAMO', 'carlos perez', 1, 'Jeime Jiménez', NOW() - INTERVAL '3 days', 'Salida para obra de demolición frente este'),
(104, 'Martillo Demoledor Hilti TE 2000', 'DEVOLUCION', 'carlos perez', 1, 'Jeime Jiménez', NOW() - INTERVAL '2 days', 'Devolución en óptimo estado con cable limpio'),
(106, 'Amoladora Angular DeWalt 4-1/2"', 'PRESTAMO', 'andres gomez', 2, 'Rhonis Julio', NOW() - INTERVAL '1 day', 'Entrega con disco de corte montado'),
(106, 'Amoladora Angular DeWalt 4-1/2"', 'DEVOLUCION', 'andres gomez', 2, 'Rhonis Julio', NOW() - INTERVAL '4 hours', 'Herramienta recibida y probada en vacío');
