import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import databaseManager from '../../DatabaseManager';

const CrearProducto = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [calculationMode, setCalculationMode] = useState('precio'); // 'precio' o 'margen'
  const [formData, setFormData] = useState({
    nombre: '',
    costo: '',
    publico: '',
    margen: '',
  });

  // Inicializar la base de datos al montar el componente
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await databaseManager.initDatabase();
        setDbInitialized(true);
      } catch (error) {
        Alert.alert(
          'Error',
          'No se pudo inicializar la base de datos',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    };

    initializeDatabase();
  }, []);

  // Efecto para calcular precio público cuando se cambia el margen o el costo
  useEffect(() => {
    if (calculationMode === 'margen' && formData.costo && formData.margen) {
      const costoNum = parseFloat(formData.costo);
      const margenNum = parseFloat(formData.margen);
      
      if (!isNaN(costoNum) && !isNaN(margenNum) && costoNum > 0 && margenNum >= 0) {
        const precioPublico = costoNum * (1 + margenNum / 100);
        setFormData(prev => ({
          ...prev,
          publico: precioPublico.toFixed(2)
        }));
      }
    }
  }, [formData.costo, formData.margen, calculationMode]);

  // Efecto para calcular margen cuando se cambia el precio público o el costo (modo precio)
  useEffect(() => {
    if (calculationMode === 'precio' && formData.costo && formData.publico) {
      const costoNum = parseFloat(formData.costo);
      const publicoNum = parseFloat(formData.publico);
      
      if (!isNaN(costoNum) && !isNaN(publicoNum) && costoNum > 0) {
        const margen = ((publicoNum - costoNum) / costoNum * 100);
        setFormData(prev => ({
          ...prev,
          margen: margen.toFixed(1)
        }));
      }
    }
  }, [formData.costo, formData.publico, calculationMode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModeChange = (mode: string) => {
    setCalculationMode(mode);
    // Limpiar solo el campo que no se usa en el nuevo modo
    if (mode === 'precio') {
      // En modo precio, limpiar margen
      setFormData(prev => ({
        ...prev,
        margen: ''
      }));
    } else {
      // En modo margen, limpiar publico para que se recalcule automáticamente
      setFormData(prev => ({
        ...prev,
        publico: ''
      }));
    }
  };

  const validateForm = () => {
    const { nombre, costo, publico, margen } = formData;

    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return false;
    }

    if (!costo.trim()) {
      Alert.alert('Error', 'El costo del producto es requerido');
      return false;
    }

    const costoNum = parseFloat(costo);

    if (isNaN(costoNum) || costoNum <= 0) {
      Alert.alert('Error', 'El costo debe ser un número válido mayor a 0');
      return false;
    }

    if (calculationMode === 'precio') {
      if (!publico.trim()) {
        Alert.alert('Error', 'El precio público del producto es requerido');
        return false;
      }

      const publicoNum = parseFloat(publico);

      if (isNaN(publicoNum) || publicoNum <= 0) {
        Alert.alert('Error', 'El precio público debe ser un número válido mayor a 0');
        return false;
      }

      if (publicoNum <= costoNum) {
        Alert.alert('Error', 'El precio público debe ser mayor al costo');
        return false;
      }
    } else {
      // Modo margen
      if (!margen.trim()) {
        Alert.alert('Error', 'El margen de ganancia es requerido');
        return false;
      }

      const margenNum = parseFloat(margen);

      if (isNaN(margenNum) || margenNum < 0) {
        Alert.alert('Error', 'El margen debe ser un número válido mayor o igual a 0');
        return false;
      }

      // Validar que el precio público calculado sea válido
      if (!publico || publico.trim() === '') {
        Alert.alert('Error', 'No se pudo calcular el precio público. Verifica el costo y el margen.');
        return false;
      }

      const publicoCalculado = parseFloat(publico);
      if (isNaN(publicoCalculado) || publicoCalculado <= costoNum) {
        Alert.alert('Error', 'El margen resulta en un precio público inválido');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!dbInitialized) {
      Alert.alert('Error', 'La base de datos no está lista');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { nombre, costo, publico } = formData;

      // Convertir costo de pesos a centavos
      const costoInt = Math.round(parseFloat(costo) * 100);
      
      // Validar que publico tenga valor antes de parsearlo
      if (!publico || publico.trim() === '') {
        throw new Error('El precio público no está calculado correctamente');
      }

      const publicoFloat = parseFloat(publico);

      if (isNaN(publicoFloat) || publicoFloat <= 0) {
        throw new Error('El precio público es inválido o no se calculó correctamente');
      }

      // Convertir público de pesos a centavos
      const publicoInt = Math.round(publicoFloat * 100);

      console.log('Creando producto:', { nombre: nombre.trim(), costoInt, publicoInt });

      const result = await databaseManager.createProducto(
        nombre.trim(),
        costoInt,
        publicoInt
      );

      if (result.success) {
        Alert.alert(
          'Éxito',
          'Producto creado exitosamente',
          [
            {
              text: 'OK',
              onPress: () => {
                setFormData({ nombre: '', costo: '', publico: '', margen: '' });
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Error al crear el producto');
      }
    } catch (error) {
      console.error('Error al crear producto:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error inesperado al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar',
      '¿Estás seguro de que deseas cancelar? Se perderán los datos ingresados.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Sí',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {!dbInitialized ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Inicializando base de datos...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Crear Producto</Text>
            <Text style={styles.subtitle}>
              Ingresa los datos del nuevo producto
            </Text>
          </View>

          <View style={styles.form}>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(value) => handleInputChange('nombre', value)}
                placeholder="Nombre del producto"
                autoCapitalize="words"
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Costo *</Text>
              <TextInput
                style={styles.input}
                value={formData.costo}
                onChangeText={(value) => handleInputChange('costo', value)}
                placeholder="0.00"
                keyboardType="numeric"
                maxLength={10}
              />
              <Text style={styles.helper}>
                Precio de costo del producto
              </Text>
            </View>

            {/* Selector de modo de cálculo */}
            <View style={styles.modeSelector}>
              <Text style={styles.label}>Método de cálculo</Text>
              <View style={styles.modeButtons}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    calculationMode === 'precio' && styles.modeButtonActive
                  ]}
                  onPress={() => handleModeChange('precio')}
                >
                  <Text style={[
                    styles.modeButtonText,
                    calculationMode === 'precio' && styles.modeButtonTextActive
                  ]}>
                    Por Precio
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    calculationMode === 'margen' && styles.modeButtonActive
                  ]}
                  onPress={() => handleModeChange('margen')}
                >
                  <Text style={[
                    styles.modeButtonText,
                    calculationMode === 'margen' && styles.modeButtonTextActive
                  ]}>
                    Por Margen
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {calculationMode === 'precio' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Precio Público *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.publico}
                  onChangeText={(value) => handleInputChange('publico', value)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text style={styles.helper}>
                  Precio de venta al público
                </Text>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Margen de Ganancia * (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.margen}
                  onChangeText={(value) => handleInputChange('margen', value)}
                  placeholder="0.0"
                  keyboardType="numeric"
                  maxLength={6}
                />
                <Text style={styles.helper}>
                  Porcentaje de ganancia sobre el costo
                </Text>
              </View>
            )}

            {/* Mostrar información calculada */}
            {formData.costo && (calculationMode === 'precio' ? formData.publico : formData.margen) && (
              <View style={styles.calculationInfo}>
                {calculationMode === 'precio' ? (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Margen de ganancia:</Text>
                      <Text style={styles.infoValue}>
                        {formData.margen}%
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Precio público calculado:</Text>
                      <Text style={styles.infoValue}>
                        ${formData.publico}
                      </Text>
                    </View>
                  </>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ganancia por unidad:</Text>
                  <Text style={styles.infoValue}>
                    ${(parseFloat(formData.publico || '0') - parseFloat(formData.costo || '0')).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Crear Producto</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  form: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  helper: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modeSelector: {
    marginBottom: 20,
  },
  modeButtons: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  calculationInfo: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
});

export default CrearProducto;