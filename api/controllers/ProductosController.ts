import { ProductosService, Producto } from '../services/ProductoService';
import { ImageService } from '../services/ImagenesService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ProductosController {
  static async getAllProductos(): Promise<ApiResponse<Producto[]>> {
    try {
      const productos = await ProductosService.getAll();
      return {
        success: true,
        data: productos,
        message: `${productos.length} productos encontrados`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  static async getProductoById(id: number): Promise<ApiResponse<Producto>> {
    try {
      const producto = await ProductosService.getById(id);
      if (!producto) {
        return {
          success: false,
          error: 'Producto no encontrado'
        };
      }
      
      return {
        success: true,
        data: producto
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  static async createProducto(productoData: Omit<Producto, 'id'>, imageUri?: string): Promise<ApiResponse<Producto>> {
    try {
      let rutaImagen = '';
      
      if (imageUri) {
        rutaImagen = await ImageService.saveImage(imageUri);
      }
      
      const producto = await ProductosService.create({
        ...productoData,
        ruta_imagen: rutaImagen
      });
      
      return {
        success: true,
        data: producto,
        message: 'Producto creado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

    // En ProductosController.ts - método updateProducto
    static async updateProducto(id: number, productoData: Partial<Producto>, imageUri?: string): Promise<ApiResponse<Producto>> {
    try {
        const productoExistente = await ProductosService.getById(id);
        if (!productoExistente) {
        return {
            success: false,
            error: 'Producto no encontrado'
        };
        }

        let rutaImagen = productoExistente.ruta_imagen;
        
        if (imageUri) {
        // Eliminar imagen anterior si existe
        if (rutaImagen) {
            await ImageService.deleteImage(rutaImagen);
        }
        rutaImagen = await ImageService.saveImage(imageUri);
        }
        
        const producto = await ProductosService.update(id, {
        ...productoData,
        ruta_imagen: rutaImagen
        });
        
        // Verificar que el producto actualizado no sea null
        if (!producto) {
        return {
            success: false,
            error: 'Error al actualizar el producto'
        };
        }
        
        return {
        success: true,
        data: producto, // Ahora TypeScript sabe que no es null
        message: 'Producto actualizado exitosamente'
        };
    } catch (error) {
        return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
    }

  static async deleteProducto(id: number): Promise<ApiResponse<boolean>> {
    try {
      const producto = await ProductosService.getById(id);
      if (!producto) {
        return {
          success: false,
          error: 'Producto no encontrado'
        };
      }

      // Eliminar imagen si existe
      if (producto.ruta_imagen) {
        await ImageService.deleteImage(producto.ruta_imagen);
      }

      const deleted = await ProductosService.delete(id);
      
      return {
        success: deleted,
        data: deleted,
        message: deleted ? 'Producto eliminado exitosamente' : 'No se pudo eliminar el producto'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  static async getProductosByProveedor(id_proveedor: number): Promise<ApiResponse<Producto[]>> {
    try {
      const productos = await ProductosService.getByProveedor(id_proveedor);
      return {
        success: true,
        data: productos,
        message: `${productos.length} productos encontrados para el proveedor`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  static async getProductoImage(fileName: string): Promise<ApiResponse<string>> {
    try {
      if (!fileName) {
        return {
          success: false,
          error: 'Nombre de archivo no proporcionado'
        };
      }

      const imageUri = await ImageService.getImageUri(fileName);
      const exists = await ImageService.imageExists(fileName);
      
      if (!exists) {
        return {
          success: false,
          error: 'Imagen no encontrada'
        };
      }

      return {
        success: true,
        data: imageUri
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}