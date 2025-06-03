import * as SQLite from 'expo-sqlite';

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  // Inicializar la base de datos
  async initDatabase() {
    try {
      this.db = await SQLite.openDatabaseAsync('productos.db');

      // Verificar si existe la columna cod y reiniciar base si es necesario
      const checkColumnQuery = `PRAGMA table_info(productos);`;
      const columns = await this.db.getAllAsync(checkColumnQuery);

      const hasCodColumn = columns.some(col => col.name === 'cod');
      if (hasCodColumn) {
        console.warn('La columna cod existe, se procederá a eliminar la tabla y crearla de nuevo.');
        await this.db.runAsync(`DROP TABLE IF EXISTS productos;`);
      }

      await this.createTables();
      console.log('Base de datos inicializada correctamente');
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      throw error;
    }
  }

  // Crear la tabla productos sin la columna cod
  async createTables() {
    const createProductosTable = `
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        costo INTEGER NOT NULL,
        publico INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await this.db.execAsync(createProductosTable);
      console.log('Tabla productos creada correctamente');
    } catch (error) {
      console.error('Error al crear tabla productos:', error);
      throw error;
    }
  }

  // CRUD PRODUCTOS

  async createProducto(nombre, costo, publico) {
    const query = `
      INSERT INTO productos (nombre, costo, publico)
      VALUES (?, ?, ?)
    `;

    try {
      const result = await this.db.runAsync(query, [nombre, costo, publico]);
      console.log('Producto creado con ID:', result.lastInsertRowId);
      return {
        success: true,
        id: result.lastInsertRowId,
        message: 'Producto creado exitosamente'
      };
    } catch (error) {
      console.error('Error al crear producto:', error);
      return {
        success: false,
        message: 'Error al crear el producto'
      };
    }
  }

  async getAllProductos() {
    const query = `SELECT * FROM productos ORDER BY nombre ASC`;

    try {
      const result = await this.db.getAllAsync(query);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return {
        success: false,
        message: 'Error al obtener los productos',
        data: []
      };
    }
  }

  async getProductoById(id) {
    const query = `SELECT * FROM productos WHERE id = ?`;

    try {
      const result = await this.db.getFirstAsync(query, [id]);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error al obtener producto por ID:', error);
      return {
        success: false,
        message: 'Error al obtener el producto'
      };
    }
  }

  // 🔥 Eliminado: getProductoByCod()

  async searchProductosByNombre(searchTerm) {
    const query = `
      SELECT * FROM productos 
      WHERE nombre LIKE ? 
      ORDER BY nombre ASC
    `;

    try {
      const result = await this.db.getAllAsync(query, [`%${searchTerm}%`]);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error al buscar productos:', error);
      return {
        success: false,
        message: 'Error al buscar productos',
        data: []
      };
    }
  }

  async updateProducto(id, nombre, costo, publico) {
    const query = `
      UPDATE productos 
      SET nombre = ?, costo = ?, publico = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await this.db.runAsync(query, [nombre, costo, publico, id]);
      if (result.changes > 0) {
        return {
          success: true,
          message: 'Producto actualizado exitosamente'
        };
      } else {
        return {
          success: false,
          message: 'No se encontró el producto a actualizar'
        };
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      return {
        success: false,
        message: 'Error al actualizar el producto'
      };
    }
  }

  async deleteProducto(id) {
    const query = `DELETE FROM productos WHERE id = ?`;

    try {
      const result = await this.db.runAsync(query, [id]);
      if (result.changes > 0) {
        return {
          success: true,
          message: 'Producto eliminado exitosamente'
        };
      } else {
        return {
          success: false,
          message: 'No se encontró el producto a eliminar'
        };
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      return {
        success: false,
        message: 'Error al eliminar el producto'
      };
    }
  }

  async getProductosCount() {
    const query = `SELECT COUNT(*) as total FROM productos`;

    try {
      const result = await this.db.getFirstAsync(query);
      return {
        success: true,
        count: result.total
      };
    } catch (error) {
      console.error('Error al contar productos:', error);
      return {
        success: false,
        count: 0
      };
    }
  }

  async getProductosPaginated(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM productos 
      ORDER BY nombre ASC 
      LIMIT ? OFFSET ?
    `;

    try {
      const result = await this.db.getAllAsync(query, [limit, offset]);
      return {
        success: true,
        data: result,
        page,
        limit
      };
    } catch (error) {
      console.error('Error al obtener productos paginados:', error);
      return {
        success: false,
        message: 'Error al obtener productos',
        data: []
      };
    }
  }

  async clearAllProductos() {
    const query = `DELETE FROM productos`;

    try {
      await this.db.runAsync(query);
      return {
        success: true,
        message: 'Todos los productos han sido eliminados'
      };
    } catch (error) {
      console.error('Error al limpiar productos:', error);
      return {
        success: false,
        message: 'Error al limpiar los productos'
      };
    }
  }

  async closeDatabase() {
    try {
      if (this.db) {
        await this.db.closeAsync();
        console.log('Base de datos cerrada correctamente');
      }
    } catch (error) {
      console.error('Error al cerrar la base de datos:', error);
    }
  }
}

const databaseManager = new DatabaseManager();
export default databaseManager;
