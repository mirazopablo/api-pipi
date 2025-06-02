import { getDatabase } from '../database/sqlite';

export interface Proveedor {
  id?: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  created_at?: string;
  updated_at?: string;
}

export class ProveedoresService {
  static async getAll(): Promise<Proveedor[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync('SELECT * FROM proveedores ORDER BY nombre');
    return result as Proveedor[];
  }

  static async getById(id: number): Promise<Proveedor | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync('SELECT * FROM proveedores WHERE id = ?', [id]);
    return result as Proveedor | null;
  }

  static async create(proveedor: Omit<Proveedor, 'id' | 'created_at' | 'updated_at'>): Promise<Proveedor> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO proveedores (nombre, contacto, telefono) VALUES (?, ?, ?)',
      [proveedor.nombre, proveedor.contacto || '', proveedor.telefono || '']
    );
    
    const newProveedor = await this.getById(result.lastInsertRowId);
    if (!newProveedor) throw new Error('Error creating proveedor');
    return newProveedor;
  }

    static async update(id: number, proveedor: Partial<Proveedor>): Promise<Proveedor | null> {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE proveedores SET nombre = ?, contacto = ?, telefono = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
        proveedor.nombre ?? null,      // Convierte undefined a null
        proveedor.contacto ?? null,    // Convierte undefined a null
        proveedor.telefono ?? null,    // Convierte undefined a null
        id
        ]
    );
    
    return await this.getById(id);
    }

  static async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync('DELETE FROM proveedores WHERE id = ?', [id]);
    return result.changes > 0;
  }
}