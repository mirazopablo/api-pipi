import { getDatabase } from '../database/sqlite';

export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  id_proveedor?: number;
  ruta_imagen?: string;
  created_at?: string;
  updated_at?: string;
  proveedor_nombre?: string; // Para joins
}

export class ProductosService {
  static async getAll(): Promise<Producto[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync(`
      SELECT p.*, pr.nombre as proveedor_nombre 
      FROM productos p 
      LEFT JOIN proveedores pr ON p.id_proveedor = pr.id 
      ORDER BY p.nombre
    `);
    return result as Producto[];
  }

  static async getById(id: number): Promise<Producto | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync(`
      SELECT p.*, pr.nombre as proveedor_nombre 
      FROM productos p 
      LEFT JOIN proveedores pr ON p.id_proveedor = pr.id 
      WHERE p.id = ?
    `, [id]);
    return result as Producto | null;
  }

  static async getByProveedor(id_proveedor: number): Promise<Producto[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync(`
      SELECT p.*, pr.nombre as proveedor_nombre 
      FROM productos p 
      LEFT JOIN proveedores pr ON p.id_proveedor = pr.id 
      WHERE p.id_proveedor = ? 
      ORDER BY p.nombre
    `, [id_proveedor]);
    return result as Producto[];
  }

  static async create(producto: Omit<Producto, 'id' | 'created_at' | 'updated_at'>): Promise<Producto> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO productos (nombre, descripcion, precio, id_proveedor, ruta_imagen) VALUES (?, ?, ?, ?, ?)',
      [
        producto.nombre,
        producto.descripcion || '',
        producto.precio,
        producto.id_proveedor || null,
        producto.ruta_imagen || null
      ]
    );
    
    const newProducto = await this.getById(result.lastInsertRowId);
    if (!newProducto) throw new Error('Error creating producto');
    return newProducto;
  }

    static async update(id: number, producto: Partial<Producto>): Promise<Producto | null> {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, id_proveedor = ?, ruta_imagen = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
        producto.nombre ?? null,          // Convierte undefined a null
        producto.descripcion ?? null,     // Convierte undefined a null  
        producto.precio ?? null,          // Convierte undefined a null
        producto.id_proveedor ?? null,    // Convierte undefined a null
        producto.ruta_imagen ?? null,     // Convierte undefined a null
        id
        ]
    );
    
    return await this.getById(id);
    }

  static async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync('DELETE FROM productos WHERE id = ?', [id]);
    return result.changes > 0;
  }
}