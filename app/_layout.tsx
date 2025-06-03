// app/_layout.tsx
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <PaperProvider>
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
      </Stack>
    </PaperProvider>
  );
}
