import { dbManager } from './database/sqlite';
import { ImageService } from './services/ImagenesService';

export class OfflineApi {
  private static initialized = false;

  static async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Inicializar base de datos
      await dbManager.initDatabase();
      console.log('Database initialized successfully');
      
      // Inicializar directorio de imágenes
      await ImageService.initImageDirectory();
      console.log('Image directory initialized successfully');
      
      this.initialized = true;
      console.log('Offline API initialized successfully');
    } catch (error) {
      console.error('Error initializing Offline API:', error);
      throw error;
    }
  }

  static async cleanup(): Promise<void> {
    try {
      await dbManager.closeDatabase();
      this.initialized = false;
      console.log('Offline API cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Exportar todo lo necesario para usar en la app
export { ApiRouter } from './routes/ApiRouter';
export { ProductosController } from './controllers/ProductosController';
export { ProveedoresController } from './controllers/ProveedoresController';
export { ImageService } from './services/ImagenesService';
export type { ApiRequest } from './routes/ApiRouter';
export type { Producto } from './services/ProductoService';
export type { Proveedor } from './services/ProveedoresService';