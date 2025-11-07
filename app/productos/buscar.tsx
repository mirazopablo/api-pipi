//app/productos/buscar.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Producto } from '../../types';
import databaseManager from '../../DatabaseManager';

const BuscarProductos = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalProductos, setTotalProductos] = useState(0);
  const [modoCliente, setModoCliente] = useState(false);

  // Inicializar la base de datos
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await databaseManager.initDatabase();
        setDbInitialized(true);
      } catch (error) {
        Alert.alert('Error', 'No se pudo inicializar la base de datos');
      }
    };

    initializeDatabase();
  }, []);

  // Cargar todos los productos desde DatabaseManager
  const loadProductos = useCallback(async () => {
    if (!dbInitialized) return;

    setLoading(true);
    try {
      const result = await databaseManager.getAllProductos();
      if (result.success) {
        setProductos(result.data);
        setTotalProductos(result.data.length);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los productos');
        setProductos([]);
        setTotalProductos(0);
      }
    } catch (error) {
      console.error('Error loading productos:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar los productos');
      setProductos([]);
      setTotalProductos(0);
    } finally {
      setLoading(false);
    }
  }, [dbInitialized]);

  // 🚀 AUTO-ACTUALIZACIÓN: Se ejecuta cada vez que la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      if (dbInitialized) {
        // Si hay un término de búsqueda activo, mantener la búsqueda
        if (searchTerm.trim()) {
          searchProductos(searchTerm);
        } else {
          // Si no hay búsqueda, cargar todos los productos
          loadProductos();
        }
      }
    }, [dbInitialized, searchTerm, loadProductos])
  );

  // Buscar productos por nombre usando DatabaseManager
  const searchProductos = async (term: string) => {
    if (!dbInitialized) return;

    if (!term.trim()) {
      loadProductos();
      return;
    }

    setLoading(true);
    try {
      const result = await databaseManager.searchProductosByNombre(term.trim());
      if (result.success) {
        setProductos(result.data);
      } else {
        Alert.alert('Error', 'No se pudo realizar la búsqueda');
        setProductos([]);
      }
    } catch (error) {
      console.error('Error searching productos:', error);
      Alert.alert('Error', 'Ocurrió un error durante la búsqueda');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio en el campo de búsqueda
  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    // Debounce: buscar después de 500ms de inactividad
    const timeoutId = setTimeout(() => {
      searchProductos(text);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('');
    loadProductos();
  };

  // Toggle modo cliente
  const toggleModoCliente = () => {
    setModoCliente(prev => !prev);
  };

  // Refresh pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (searchTerm.trim()) {
      await searchProductos(searchTerm);
    } else {
      await loadProductos();
    }
    setRefreshing(false);
  }, [searchTerm, dbInitialized, loadProductos]);

  // Formatear precio (convertir de centavos a pesos)
  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2);
  };

  // Calcular margen de ganancia
  const calcularMargen = (costo: number, publico: number) => {
    if (costo === 0) return 0;
    return ((publico - costo) / costo * 100);
  };

  // Navegar a editar producto
  const handleEditarProducto = (producto: Producto) => {
    router.push(`/productos/editar?id=${producto.id}` as any);
  };

  // Confirmar y eliminar producto
  const handleEliminarProducto = (producto: Producto) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro de que deseas eliminar "${producto.nombre}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarProducto(producto.id),
        },
      ]
    );
  };

  // Eliminar producto usando DatabaseManager
  const eliminarProducto = async (id: number) => {
    setLoading(true);
    try {
      const result = await databaseManager.deleteProducto(id);
      if (result.success) {
        Alert.alert('Éxito', 'Producto eliminado correctamente');
        
        // Recargar lista
        if (searchTerm.trim()) {
          searchProductos(searchTerm);
        } else {
          loadProductos();
        }
      } else {
        Alert.alert('Error', result.message || 'No se pudo eliminar el producto');
      }
    } catch (error) {
      console.error('Error deleting producto:', error);
      Alert.alert('Error', 'Ocurrió un error al eliminar el producto');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar cada producto
  const renderProducto = ({ item }: { item: Producto }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.nombre}</Text>
        </View>
        {!modoCliente && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditarProducto(item)}
            >
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleEliminarProducto(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {modoCliente ? (
        // Modo Cliente: Solo precio de venta destacado
        <View style={styles.clientePriceContainer}>
          <Text style={styles.clientePriceLabel}>Precio</Text>
          <Text style={styles.clientePriceValue}>
            ${formatPrice(item.publico)}
          </Text>
        </View>
      ) : (
        // Modo Normal: Todos los precios
        <View style={styles.priceContainer}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Costo:</Text>
            <Text style={styles.priceValue}>${formatPrice(item.costo)}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Público:</Text>
            <Text style={[styles.priceValue, styles.publicPrice]}>
              ${formatPrice(item.publico)}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Margen:</Text>
            <Text style={[styles.priceValue, styles.marginValue]}>
              {calcularMargen(item.costo, item.publico).toFixed(1)}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // Renderizar lista vacía
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {searchTerm ? 'No se encontraron productos' : 'No hay productos'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchTerm 
          ? `No hay productos que coincidan con "${searchTerm}"`
          : 'Comienza creando tu primer producto'
        }
      </Text>
      {!searchTerm && !modoCliente && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/productos/crear' as any)}
        >
          <Text style={styles.createButtonText}>Crear Producto</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (!dbInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Inicializando base de datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Productos</Text>
            <Text style={styles.subtitle}>
              {totalProductos} producto{totalProductos !== 1 ? 's' : ''} total{totalProductos !== 1 ? 'es' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.eyeButton, modoCliente && styles.eyeButtonActive]}
            onPress={toggleModoCliente}
          >
            <Ionicons 
              name={modoCliente ? "eye-off" : "eye-outline"} 
              size={24} 
              color={modoCliente ? "#fff" : "#007AFF"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={handleSearchChange}
            placeholder="Buscar productos por nombre..."
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de productos con FlashList */}
      <FlashList
        data={productos}
        renderItem={renderProducto}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Loading overlay */}
      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {/* Botón flotante para crear producto */}
      {!modoCliente && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/productos/crear' as any)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  eyeButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f7ff',
    marginLeft: 12,
  },
  eyeButtonActive: {
    backgroundColor: '#28a745',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  productCard: {
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f7ff',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff0f0',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  publicPrice: {
    color: '#007AFF',
  },
  marginValue: {
    color: '#28a745',
  },
  clientePriceContainer: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  clientePriceLabel: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clientePriceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default BuscarProductos;