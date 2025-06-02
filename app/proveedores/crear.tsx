import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ApiRouter } from '../../api/routes/ApiRouter';

interface FormData {
  nombre: string;
  contacto: string;
  telefono: string;
}

interface FormErrors {
  nombre?: string;
  contacto?: string;
  telefono?: string;
}

export default function CrearProveedorScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    contacto: '',
    telefono: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre (requerido)
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar teléfono (formato básico si se proporciona)
    if (formData.telefono.trim() && !/^[\d\s\-\+\(\)]{7,}$/.test(formData.telefono.trim())) {
      newErrors.telefono = 'Formato de teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo al escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await ApiRouter.handleRequest({
        method: 'POST',
        path: '/proveedores',
        body: {
          nombre: formData.nombre.trim(),
          contacto: formData.contacto.trim() || null,
          telefono: formData.telefono.trim() || null,
        }
      });

      if (response.success) {
        Alert.alert(
          'Éxito',
          'Proveedor creado correctamente',
          [
            {
              text: 'Ver Proveedores',
              onPress: () => router.push('/proveedores/buscar')
            },
            {
              text: 'Crear Otro',
              onPress: () => {
                setFormData({
                  nombre: '',
                  contacto: '',
                  telefono: '',
                });
                setErrors({});
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'No se pudo crear el proveedor');
      }
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (formData.nombre || formData.contacto || formData.telefono) {
      Alert.alert(
        'Confirmar',
        '¿Estás seguro de salir? Se perderán los datos ingresados.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.title}>Crear Proveedor</Text>
            <Text style={styles.subtitle}>Completa la información</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            
            {/* Campo Nombre */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Nombre del Proveedor <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.nombre && styles.inputError]}
                value={formData.nombre}
                onChangeText={(text) => handleInputChange('nombre', text)}
                placeholder="Ej: Distribuidora ABC S.A."
                maxLength={100}
                editable={!loading}
              />
              {errors.nombre && (
                <Text style={styles.errorText}>{errors.nombre}</Text>
              )}
            </View>

            {/* Campo Contacto */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Persona de Contacto</Text>
              <TextInput
                style={styles.input}
                value={formData.contacto}
                onChangeText={(text) => handleInputChange('contacto', text)}
                placeholder="Ej: Juan Pérez"
                maxLength={100}
                editable={!loading}
              />
              {errors.contacto && (
                <Text style={styles.errorText}>{errors.contacto}</Text>
              )}
            </View>

            {/* Campo Teléfono */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={[styles.input, errors.telefono && styles.inputError]}
                value={formData.telefono}
                onChangeText={(text) => handleInputChange('telefono', text)}
                placeholder="Ej: +54 261 123-4567"
                keyboardType="phone-pad"
                maxLength={20}
                editable={!loading}
              />
              {errors.telefono && (
                <Text style={styles.errorText}>{errors.telefono}</Text>
              )}
            </View>

            {/* Información adicional */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={16} color="#666" />
              <Text style={styles.infoText}>
                Solo el nombre es obligatorio. Los demás campos son opcionales.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleGoBack}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.submitButtonText}>Guardando...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Crear Proveedor</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardContainer: {
    flex: 1,
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
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF5722',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF5722',
  },
  errorText: {
    color: '#FF5722',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});