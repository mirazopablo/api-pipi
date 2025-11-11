#!/usr/bin/env bash

set -euo pipefail

echo "🔧 Parcheando archivos de Gradle para desactivar -Werror..."

# Parchear react-native-gradle-plugin
REACT_NATIVE_GRADLE_FILE="node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build.gradle.kts"

if [ -f "$REACT_NATIVE_GRADLE_FILE" ]; then
    echo "Parcheando $REACT_NATIVE_GRADLE_FILE"
    # Buscar y reemplazar allWarningsAsErrors
    if grep -q "allWarningsAsErrors = true" "$REACT_NATIVE_GRADLE_FILE"; then
        sed -i.bak 's/allWarningsAsErrors = true/allWarningsAsErrors = false/g' "$REACT_NATIVE_GRADLE_FILE"
        echo "✅ Parche aplicado exitosamente"
    else
        echo "⚠️  No se encontró allWarningsAsErrors en el archivo"
    fi
else
    echo "⚠️  Archivo no encontrado: $REACT_NATIVE_GRADLE_FILE"
fi

# Parchear expo-gradle-plugins
for GRADLE_FILE in node_modules/expo-modules-*/android/**/build.gradle.kts; do
    if [ -f "$GRADLE_FILE" ] && grep -q "allWarningsAsErrors" "$GRADLE_FILE"; then
        echo "Parcheando $GRADLE_FILE"
        sed -i.bak 's/allWarningsAsErrors = true/allWarningsAsErrors = false/g' "$GRADLE_FILE"
    fi
done

echo "✅ Parches de Gradle completados"
