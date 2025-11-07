//app/productos/editar.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Producto } from '../../types';
import databaseManager from '../../DatabaseManager';

interface FormData {
  nombre: string;
  costo: string;
  publico: string;
  margen: string;
}

interface FormErrors {
  nombre?: string;
  costo?: string;
  publico?: string;
  margen?: string;
}

const EditarProducto = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productoId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [calculationMode, setCalculationMode] = useState('margen'); // 'precio' o 'margen'
  const [productoOriginal, setProductoOriginal] = useState<Producto | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    costo: '',
    publico: '',
    margen: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Inicializar la base de datos
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

  // Cargar datos del producto desde DatabaseManager
  useEffect(() => {
    const fetchProducto = async () => {
      if (!dbInitialized || !productoId) return;

      try {
        const result = await databaseManager.getProductoById(parseInt(productoId));

        if (!result.success || !result.data) {
          Alert.alert('Error', 'Producto no encontrado', [
            { text: 'OK', onPress: () => router.back() }
          ]);
          return;
        }

        const producto = result.data;
        setProductoOriginal(producto);

        // Convertir de centavos a pesos
        const costoEnPesos = producto.costo / 100;
        const publicoEnPesos = producto.publico / 100;
        
        // Calcular el porcentaje de ganancia
        const porcentaje = costoEnPesos > 0 
          ? ((publicoEnPesos - costoEnPesos) / costoEnPesos * 100)
          : 0;

        setFormData({
          nombre: producto.nombre,
          costo: costoEnPesos.toFixed(2),
          publico: publicoEnPesos.toFixed(2),
          margen: porcentaje.toFixed(1),
        });

      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar el producto');
      } finally {
        setLoadingData(false);
      }
    };

    fetchProducto();
  }, [dbInitialized, productoId]);

  // Efecto para calcular precio público cuando se cambia el margen o el costo (modo margen)
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

  // Cambiar modo de cálculo
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
      // En modo margen, limpiar publico para que se recalcule
      setFormData(prev => ({
        ...prev,
        publico: ''
      }));
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    const costoNum = parseFloat(formData.costo);
    if (!formData.costo.trim() || isNaN(costoNum) || costoNum <= 0) {
      newErrors.costo = 'Ingresa un costo válido mayor a 0';
    }

    if (calculationMode === 'precio') {
      if (!formData.publico.trim()) {
        newErrors.publico = 'El precio público es requerido';
        setErrors(newErrors);
        return false;
      }

      const publicoNum = parseFloat(formData.publico);
      if (isNaN(publicoNum) || publicoNum <= 0) {
        newErrors.publico = 'El precio público debe ser mayor a 0';
      }

      if (publicoNum <= costoNum) {
        newErrors.publico = 'El precio público debe ser mayor al costo';
      }
    } else {
      // Modo margen
      if (!formData.margen.trim()) {
        newErrors.margen = 'El margen es requerido';
        setErrors(newErrors);
        return false;
      }

      const margenNum = parseFloat(formData.margen);
      if (isNaN(margenNum) || margenNum < 0) {
        newErrors.margen = 'Ingresa un margen válido (0 o mayor)';
      }

      // Validar que el precio público calculado sea válido
      if (!formData.publico || formData.publico.trim() === '') {
        newErrors.margen = 'No se pudo calcular el precio público';
        setErrors(newErrors);
        return false;
      }

      const publicoCalculado = parseFloat(formData.publico);
      if (isNaN(publicoCalculado) || publicoCalculado <= costoNum) {
        newErrors.margen = 'El margen resulta en un precio público inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambio en inputs
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Formatear número con dos decimales
  const formatPrice = (price: string | number): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Actualizar producto usando DatabaseManager
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor, completa todos los campos correctamente');
      return;
    }

    setLoading(true);
    try {
      // Validar que publico tenga valor
      if (!formData.publico || formData.publico.trim() === '') {
        throw new Error('El precio público no está calculado correctamente');
      }

      // Convertir los precios de pesos a centavos para guardar en BD
      const costoEnCentavos = Math.round(parseFloat(formData.costo) * 100);
      const publicoEnCentavos = Math.round(parseFloat(formData.publico) * 100);

      console.log('Actualizando producto:', { 
        id: productoId, 
        nombre: formData.nombre.trim(), 
        costoEnCentavos, 
        publicoEnCentavos 
      });

      const result = await databaseManager.updateProducto(
        parseInt(productoId),
        formData.nombre.trim(),
        costoEnCentavos,
        publicoEnCentavos
      );

      if (result.success) {
        Alert.alert(
          'Éxito',
          'Producto actualizado correctamente',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Error al actualizar el producto');
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  // Restaurar valores originales
  const handleReset = () => {
    if (productoOriginal) {
      const costoEnPesos = productoOriginal.costo / 100;
      const publicoEnPesos = productoOriginal.publico / 100;
      
      const porcentaje = costoEnPesos > 0 
        ? ((publicoEnPesos - costoEnPesos) / costoEnPesos * 100)
        : 0;

      setFormData({
        nombre: productoOriginal.nombre,
        costo: costoEnPesos.toFixed(2),
        publico: publicoEnPesos.toFixed(2),
        margen: porcentaje.toFixed(1),
      });
      setErrors({});
      // Resetear al modo original (margen)
      setCalculationMode('margen');
    }
  };

  if (!dbInitialized || loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando producto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Editar Producto</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ID del Producto */}
          <View style={styles.productIdContainer}>
            <Ionicons name="pricetag-outline" size={20} color="#666" />
            <Text style={styles.productIdText}>ID del Producto: {productoId}</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nombre <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.nombre && styles.inputError]}
                value={formData.nombre}
                onChangeText={(value) => handleInputChange('nombre', value)}
                placeholder="Ej: Lámpara de Mesa Moderna"
                autoCapitalize="words"
                returnKeyType="next"
                multiline
                numberOfLines={2}
              />
              {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
            </View>

            {/* Costo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Costo (en pesos) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.currencyIcon}>$</Text>
                <TextInput
                  style={[styles.input, styles.inputWithIconText, errors.costo && styles.inputError]}
                  value={formData.costo}
                  onChangeText={(value) => handleInputChange('costo', value)}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
              </View>
              {errors.costo && <Text style={styles.errorText}>{errors.costo}</Text>}
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
              // Modo Precio: input manual
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Precio Público <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWithIcon}>
                  <Text style={styles.currencyIcon}>$</Text>
                  <TextInput
                    style={[styles.input, styles.inputWithIconText, errors.publico && styles.inputError]}
                    value={formData.publico}
                    onChangeText={(value) => handleInputChange('publico', value)}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                </View>
                {errors.publico && <Text style={styles.errorText}>{errors.publico}</Text>}
                <Text style={styles.helperText}>
                  Precio de venta al público
                </Text>
              </View>
            ) : (
              // Modo Margen: input de porcentaje
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Margen de Ganancia <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={[styles.input, styles.inputWithIconText, errors.margen && styles.inputError]}
                    value={formData.margen}
                    onChangeText={(value) => handleInputChange('margen', value)}
                    placeholder="30"
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                  <Text style={styles.percentIcon}>%</Text>
                </View>
                {errors.margen && <Text style={styles.errorText}>{errors.margen}</Text>}
                <Text style={styles.helperText}>
                  Este porcentaje se aplicará sobre el costo para calcular el precio público
                </Text>
              </View>
            )}

            {/* Precio Público Calculado / Info */}
            {formData.costo && (calculationMode === 'precio' ? formData.publico : formData.margen) && (
              <View style={styles.calculationInfo}>
                {calculationMode === 'precio' ? (
                  // Mostrar margen calculado
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Margen de ganancia:</Text>
                    <Text style={styles.infoValue}>
                      {formData.margen}%
                    </Text>
                  </View>
                ) : (
                  // Mostrar precio calculado
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Precio público calculado:</Text>
                    <Text style={styles.infoValue}>
                      ${formData.publico}
                    </Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ganancia por unidad:</Text>
                  <Text style={styles.infoValue}>
                    ${(parseFloat(formData.publico || '0') - parseFloat(formData.costo || '0')).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Resumen */}
            {formData.publico && parseFloat(formData.publico) > 0 && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Resumen</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Costo:</Text>
                  <Text style={styles.summaryValue}>${formData.costo || '0.00'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ganancia ({formData.margen}%):</Text>
                  <Text style={[styles.summaryValue, styles.gainValue]}>
                    ${formatPrice((parseFloat(formData.publico || '0') - parseFloat(formData.costo || '0')))}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Precio Público:</Text>
                  <Text style={styles.summaryTotalValue}>${formatPrice(formData.publico)}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Botones de Acción */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={20} color="#666" />
            <Text style={styles.resetButtonText}>Restaurar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Actualizar Producto</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  productIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ff4444',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff8f8',
  },
  inputWithIcon: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithIconText: {
    flex: 1,
    paddingLeft: 36,
    paddingRight: 36,
  },
  currencyIcon: {
    position: 'absolute',
    left: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    zIndex: 1,
  },
  percentIcon: {
    position: 'absolute',
    right: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    zIndex: 1,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modeSelector: {
    marginBottom: 20,
  },
  modeButtons: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    borderRadius: 8,
    padding: 16,
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
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  gainValue: {
    color: '#28a745',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EditarProducto;