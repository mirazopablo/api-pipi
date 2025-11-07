// types/index.ts
// Interfaces que mapean directamente a la estructura de BD v1.0

export interface Producto {
  id: number;
  nombre: string;        // Campo real en BD
  costo: number;         // En centavos (como está en BD)
  publico: number;       // En centavos (como está en BD)
  created_at: string;
  updated_at: string;
}

// Helper types para conversión de precios en la UI
export interface ProductoUI {
  id: number;
  nombre: string;
  costoDisplay: string;    // Para mostrar en pesos con 2 decimales
  publicoDisplay: string;  // Para mostrar en pesos con 2 decimales
  margen: number;          // Calculado en %
}