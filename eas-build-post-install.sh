#!/usr/bin/env bash

set -euo pipefail

echo "🔧 Parcheando archivos de Gradle para desactivar -Werror y fijar versión de Kotlin..."

# Parchear react-native-gradle-plugin
REACT_NATIVE_GRADLE_FILE="node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build.gradle.kts"

if [ -f "$REACT_NATIVE_GRADLE_FILE" ]; then
    echo "Parcheando $REACT_NATIVE_GRADLE_FILE"
    if grep -q "allWarningsAsErrors = true" "$REACT_NATIVE_GRADLE_FILE"; then
        sed -i.bak 's/allWarningsAsErrors = true/allWarningsAsErrors = false/g' "$REACT_NATIVE_GRADLE_FILE"
        echo "✅ Parche aplicado exitosamente"
    fi
fi

# Parchear expo-gradle-plugins
for GRADLE_FILE in node_modules/expo-modules-*/android/**/build.gradle.kts; do
    if [ -f "$GRADLE_FILE" ] && grep -q "allWarningsAsErrors" "$GRADLE_FILE"; then
        echo "Parcheando $GRADLE_FILE"
        sed -i.bak 's/allWarningsAsErrors = true/allWarningsAsErrors = false/g' "$GRADLE_FILE"
    fi
done

# Parchear versiones de Kotlin en expo-gradle-plugin
KOTLIN_VERSIONS_FILE="node_modules/expo-modules-autolinking/android/expo-gradle-plugin/gradle-plugin/src/main/kotlin/expo/modules/plugin/configuration/KotlinVersion.kt"

if [ -f "$KOTLIN_VERSIONS_FILE" ]; then
    echo "Parcheando $KOTLIN_VERSIONS_FILE para agregar Kotlin 1.9.24"

    # Buscar la línea que contiene el mapOf con las versiones
    if grep -q '"1.9.23" to KotlinVersion' "$KOTLIN_VERSIONS_FILE"; then
        # Agregar la versión 1.9.24 después de 1.9.23
        sed -i.bak '/"1.9.23" to KotlinVersion/a\    "1.9.24" to KotlinVersion(1, 9, 24),' "$KOTLIN_VERSIONS_FILE"
        echo "✅ Kotlin 1.9.24 agregado exitosamente"
    else
        echo "⚠️  No se encontró el patrón esperado en KotlinVersion.kt"
    fi
else
    echo "⚠️  Archivo no encontrado: $KOTLIN_VERSIONS_FILE"
fi

echo "✅ Parches de Gradle completados"