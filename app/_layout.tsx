import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { OfflineApi } from '../api';

export default function RootLayout() {
  useEffect(() => {
    // Inicializar la API local al cargar la app
    const initializeApi = async () => {
      try {
        await OfflineApi.init();
        console.log('API local inicializada correctamente');
      } catch (error) {
        console.error('Error al inicializar API local:', error);
      }
    };

    initializeApi();
  }, []);

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Sistema de Inventario',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="productos/crear" 
        options={{ 
          title: 'Crear Producto',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="productos/buscar" 
        options={{ 
          title: 'Buscar Productos',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="proveedores/crear" 
        options={{ 
          title: 'Crear Proveedor',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="proveedores/buscar" 
        options={{ 
          title: 'Buscar Proveedores',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}