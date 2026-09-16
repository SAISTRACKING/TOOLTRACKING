-- Tablas del sistema

CREATE TABLE IF NOT EXISTS empleados (
    nombre TEXT PRIMARY KEY,
    cuadrilla INT NOT NULL
);

CREATE TABLE IF NOT EXISTS herramientas (
    id INT PRIMARY KEY,
    nombre TEXT NOT NULL,
    estado TEXT DEFAULT 'Disponible',
    prestada_a TEXT REFERENCES empleados(nombre) ON DELETE SET NULL,
    fecha_salida TIMESTAMPTZ,
    fecha_devolucion TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT DEFAULT 'Operador de Bodega'
);

-- Permisos y RLS
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo herramientas" ON herramientas;
CREATE POLICY "Permitir todo herramientas" ON herramientas FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo empleados" ON empleados;
CREATE POLICY "Permitir todo empleados" ON empleados FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo usuarios" ON usuarios;
CREATE POLICY "Permitir todo usuarios" ON usuarios FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON TABLE herramientas TO anon, authenticated, service_role;
GRANT ALL ON TABLE empleados TO anon, authenticated, service_role;
GRANT ALL ON TABLE usuarios TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Datos iniciales
INSERT INTO empleados (nombre, cuadrilla) VALUES
('jeime jimenez', 1),
('rhonis julio', 2),
('carlos perez', 1),
('mario ruiz', 3),
('andres gomez', 2),
('felipe mendoza', 4)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Administrador General', 'admin@tooltracking.com', 'admin123', 'Administrador General'),
('Jeime Jiménez', 'jeime@tooltracking.com', '123456', 'Supervisor de Bodega'),
('Rhonis Julio', 'rhonis@tooltracking.com', '123456', 'Supervisor de Bodega')
ON CONFLICT (email) DO NOTHING;

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
