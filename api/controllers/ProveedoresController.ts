import { ProveedoresService, Proveedor } from '../services/ProveedoresService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ProveedoresController {
  static async getAllProveedores(): Promise<ApiResponse<Proveedor[]>> {
    try {
      const proveedores = await ProveedoresService.getAll();
      return {
        success: true,
        data: proveedores,
        message: `${proveedores.length} proveedores encontrados`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  static async getProveedorById(id: number): Promise<ApiResponse<Proveedor>> {
    try {
      const proveedor = await ProveedoresService.getById(id);
      if (!proveedor) {
        return {
          success: false,
          error: 'Proveedor no encontrado'
        };
      }
      
      return {
        success: true,
        data: proveedor
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  static async createProveedor(proveedorData: Omit<Proveedor, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Proveedor>> {
    try {
      // Validaciones básicas
      if (!proveedorData.nombre || proveedorData.nombre.trim() === '') {
        return {
          success: false,
          error: 'El nombre del proveedor es obligatorio'
        };
      }

      const proveedor = await ProveedoresService.create(proveedorData);
      
      return {
        success: true,
        data: proveedor,
        message: 'Proveedor creado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

    static async updateProveedor(id: number, proveedorData: Partial<Proveedor>): Promise<ApiResponse<Proveedor>> {
    try {
        const proveedorExistente = await ProveedoresService.getById(id);
        if (!proveedorExistente) {
        return {
            success: false,
            error: 'Proveedor no encontrado'
        };
        }

        // Validaciones básicas
        if (proveedorData.nombre !== undefined && proveedorData.nombre.trim() === '') {
        return {
            success: false,
            error: 'El nombre del proveedor no puede estar vacío'
        };
        }

        const proveedor = await ProveedoresService.update(id, proveedorData);
        
        // Verificar que el proveedor actualizado no sea null
        if (!proveedor) {
        return {
            success: false,
            error: 'Error al actualizar el proveedor'
        };
        }
        
        return {
        success: true,
        data: proveedor, // Ahora TypeScript sabe que no es null
        message: 'Proveedor actualizado exitosamente'
        };
    } catch (error) {
        return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
    }

  static async deleteProveedor(id: number): Promise<ApiResponse<boolean>> {
    try {
      const proveedor = await ProveedoresService.getById(id);
      if (!proveedor) {
        return {
          success: false,
          error: 'Proveedor no encontrado'
        };
      }

      const deleted = await ProveedoresService.delete(id);
      
      return {
        success: deleted,
        data: deleted,
        message: deleted ? 'Proveedor eliminado exitosamente' : 'No se pudo eliminar el proveedor'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}