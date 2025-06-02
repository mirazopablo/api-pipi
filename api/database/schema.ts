export const CREATE_TABLES = `
  -- Tabla de Proveedores
  CREATE TABLE IF NOT EXISTS proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    contacto TEXT,
    telefono TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabla de Productos
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL,
    id_proveedor INTEGER,
    ruta_imagen TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores (id) ON DELETE SET NULL
  );

  -- Índices para optimizar consultas
  CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(id_proveedor);
  CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
`;

export const DROP_TABLES = `
  DROP TABLE IF EXISTS productos;
  DROP TABLE IF EXISTS proveedores;
`;