//app/index.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomePage() {
  const router = useRouter();

  const menuItems = [
    {
      id: 'crear-producto',
      title: 'Crear Producto',
      subtitle: 'Agregar nuevo producto',
      icon: 'add-circle' as keyof typeof Ionicons.glyphMap,
      color: '#4CAF50',
      route: '/productos/crear'
    },
    {
      id: 'buscar-producto',
      title: 'Buscar Producto',
      subtitle: 'Ver y editar productos',
      icon: 'search' as keyof typeof Ionicons.glyphMap,
      color: '#2196F3',
      route: '/productos/buscar'
    },
  
  ];

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Margarita Deco-Hogar</Text>
      </View>

      {/* Menu Grid */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuButton, { borderLeftColor: item.color }]}
            onPress={() => handleNavigation(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.buttonContent}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons 
                  name={item.icon} 
                  size={32} 
                  color={item.color} 
                />
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.buttonTitle}>{item.title}</Text>
                <Text style={styles.buttonSubtitle}>{item.subtitle}</Text>
              </View>
              
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="#666" 
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          2025 © Pablo Mirazo AKA D3XTRO - Todos los derechos reservados
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginTop: 50,
    paddingHorizontal: 24,
    paddingVertical: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    paddingVertical: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  menuButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});