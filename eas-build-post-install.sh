#!/usr/bin/env bash

set -euo pipefail

echo "🔧 Buscando y parcheando archivos de Kotlin..."

# Buscar todos los archivos que contengan el error
FILES=$(grep -rl "is missing in the map" node_modules/ 2>/dev/null || true)

if [ -z "$FILES" ]; then
    echo "⚠️  No se encontraron archivos con el error específico"

    # Buscar archivos KotlinVersion
    KOTLIN_FILES=$(find node_modules -name "*KotlinVersion*" -type f 2>/dev/null || true)

    if [ -n "$KOTLIN_FILES" ]; then
        echo "📝 Archivos encontrados relacionados con KotlinVersion:"
        echo "$KOTLIN_FILES"

        # Intentar parchear cada archivo encontrado
        for FILE in $KOTLIN_FILES; do
            if [[ $FILE == *.kt ]]; then
                echo "Intentando parchear: $FILE"
                # Buscar línea con 1.9.23 y agregar 1.9.24 después
                if grep -q "1.9.23" "$FILE"; then
                    sed -i.bak '/1.9.23/a\  "1.9.24" to KotlinVersion(1, 9, 24),' "$FILE" 2>/dev/null || true
                    echo "✅ Parche aplicado a $FILE"
                fi
            fi
        done
    fi
else
    echo "📝 Archivos encontrados con el error:"
    echo "$FILES"

    for FILE in $FILES; do
        echo "Parcheando: $FILE"
        # Buscar y agregar versión 1.9.24
        if grep -q "1.9.23" "$FILE"; then
            sed -i.bak '/1.9.23/a\  "1.9.24" to KotlinVersion(1, 9, 24),' "$FILE" 2>/dev/null || true
            echo "✅ Parche aplicado a $FILE"
        fi
    done
fi

echo "✅ Proceso de parche completado"