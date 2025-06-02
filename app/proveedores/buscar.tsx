import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ApiRouter } from '../../api/routes/ApiRouter';
// O alternativamente, si tienes un index.ts en tu carpeta api:
// import { ApiRouter } from '../../api';

interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  created_at: string;
  updated_at: string;
}

interface ProveedorGroup {
  letter: string;
  data: Proveedor[];
}

export default function BuscarProveedoresScreen() {
  const router = useRouter();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Filtrar proveedores por búsqueda
  const filteredProveedores = useMemo(() => {
    if (!searchText.trim()) return proveedores;
    
    return proveedores.filter(proveedor =>
      proveedor.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
      (proveedor.contacto && proveedor.contacto.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [proveedores, searchText]);

  // Agrupar proveedores por letra inicial
  const groupedProveedores = useMemo(() => {
    const groups: ProveedorGroup[] = [];
    const sortedProveedores = [...filteredProveedores].sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );

    // Crear grupos por letra
    const letterGroups: { [key: string]: Proveedor[] } = {};
    
    sortedProveedores.forEach(proveedor => {
      const firstLetter = proveedor.nombre.charAt(0).toUpperCase();
      const letter = /[A-ZÑ]/.test(firstLetter) ? firstLetter : '#';
      
      if (!letterGroups[letter]) {
        letterGroups[letter] = [];
      }
      letterGroups[letter].push(proveedor);
    });

    // Convertir a array y ordenar
    Object.keys(letterGroups)
      .sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
      })
      .forEach(letter => {
        groups.push({
          letter,
          data: letterGroups[letter]
        });
      });

    return groups;
  }, [filteredProveedores]);

  const loadProveedores = async () => {
    try {
      const response = await ApiRouter.handleRequest({
        method: 'GET',
        path: '/proveedores'
      });

      if (response.success && Array.isArray(response.data)) {
        setProveedores(response.data as Proveedor[]);
      } else {
        Alert.alert('Error', response.error || 'No se pudieron cargar los proveedores');
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProveedores();
  };

  const handleDeleteProveedor = (proveedor: Proveedor) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar el proveedor "${proveedor.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiRouter.handleRequest({
                method: 'DELETE',
                path: `/proveedores/${proveedor.id}`
              });

              if (response.success) {
                setProveedores(prev => prev.filter(p => p.id !== proveedor.id));
                Alert.alert('Éxito', 'Proveedor eliminado correctamente');
              } else {
                Alert.alert('Error', response.error || 'No se pudo eliminar el proveedor');
              }
            } catch (error) {
              console.error('Error al eliminar proveedor:', error);
              Alert.alert('Error', 'Ocurrió un error inesperado');
            }
          }
        }
      ]
    );
  };

  const handleEditProveedor = (proveedor: Proveedor) => {
    // Por ahora mostrar información, después implementaremos edición
    Alert.alert(
      'Información del Proveedor',
      `Nombre: ${proveedor.nombre}\n` +
      `Contacto: ${proveedor.contacto || 'No especificado'}\n` +
      `Teléfono: ${proveedor.telefono || 'No especificado'}\n` +
      `Creado: ${new Date(proveedor.created_at).toLocaleDateString()}`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDeleteProveedor(proveedor) }
      ]
    );
  };

  useEffect(() => {
    loadProveedores();
  }, []);

  const renderProveedorItem = ({ item }: { item: Proveedor }) => (
    <TouchableOpacity
      style={styles.proveedorItem}
      onPress={() => handleEditProveedor(item)}
      activeOpacity={0.7}
    >
      <View style={styles.proveedorInfo}>
        <Text style={styles.proveedorNombre}>{item.nombre}</Text>
        {item.contacto && (
          <Text style={styles.proveedorContacto}>👤 {item.contacto}</Text>
        )}
        {item.telefono && (
          <Text style={styles.proveedorTelefono}>📞 {item.telefono}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const renderGroupHeader = ({ item }: { item: ProveedorGroup }) => (
    <View style={styles.groupHeader}>
      <View style={styles.letterBadge}>
        <Text style={styles.letterText}>{item.letter}</Text>
      </View>
      <Text style={styles.groupCount}>
        {item.data.length} proveedor{item.data.length !== 1 ? 'es' : ''}
      </Text>
    </View>
  );

  const renderGroup = ({ item }: { item: ProveedorGroup }) => (
    <View style={styles.groupContainer}>
      {renderGroupHeader({ item })}
      {item.data.map((proveedor) => (
        <View key={proveedor.id}>
          {renderProveedorItem({ item: proveedor })}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Proveedores</Text>
          <Text style={styles.subtitle}>
            {filteredProveedores.length} encontrado{filteredProveedores.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/proveedores/crear')}
        >
          <Ionicons name="add" size={24} color="#FF9800" />
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o contacto..."
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchText('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de proveedores */}
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Cargando proveedores...</Text>
        </View>
      ) : groupedProveedores.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {searchText ? 'Sin resultados' : 'No hay proveedores'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchText 
              ? 'Intenta con otros términos de búsqueda'
              : 'Crea tu primer proveedor para comenzar'
            }
          </Text>
          {!searchText && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/proveedores/crear')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Crear Proveedor</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={groupedProveedores}
          renderItem={renderGroup}
          keyExtractor={(item) => item.letter}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={['#FF9800']}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  letterBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  letterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  groupCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  proveedorItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  proveedorInfo: {
    flex: 1,
  },
  proveedorNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  proveedorContacto: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  proveedorTelefono: {
    fontSize: 14,
    color: '#666',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});