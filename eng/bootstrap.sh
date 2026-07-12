#!/bin/bash
set -euo pipefail

echo "=> Bootstraping LexIA Environment..."

# 1. Dependency checks
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado."
    exit 1
fi

if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK no está instalado o no está en el PATH."
    exit 1
fi

SDK_VERSION=$(dotnet --version)
echo "✓ SDK detectado: $SDK_VERSION"

# 2. Restore
echo "=> Ejecutando Restore..."
dotnet restore
echo "✓ Restore"

# 3. Build
echo "=> Ejecutando Build estricto..."
dotnet build --no-restore
echo "✓ Build"

# 4. Unit Tests
echo "=> Ejecutando Tests de Dominio..."
if [ -d "tests/LexIA.Domain.Tests" ]; then
    dotnet test tests/LexIA.Domain.Tests --no-build
    echo "✓ Unit Tests"
else
    echo "⚠ Directorio tests/LexIA.Domain.Tests no encontrado. Omitiendo."
fi

# 5. Architecture Tests
echo "=> Ejecutando Fitness Functions..."
dotnet test tests/LexIA.Architecture.Tests --no-build --no-restore --verbosity normal
if [ $? -ne 0 ]; then
    echo "❌ Fallaron las pruebas de Arquitectura. Revisa las dependencias y reglas."
    exit 1
fi
echo "✓ Architecture Tests"

# 6. E2E Tests
echo "=> Ejecutando Pruebas End-to-End..."
if ! docker info &> /dev/null; then
    echo "⚠ Docker no disponible. Integration Tests SKIPPED (Evidence Pending)"
else
    dotnet test tests/LexIA.E2E.Tests --no-build --no-restore --verbosity normal
    if [ $? -ne 0 ]; then
        echo "❌ Fallaron las pruebas E2E. El vertical slice está roto."
        exit 1
    fi
    echo "✓ E2E Tests"
fi

echo "==================================="
echo "✓ Environment Ready"
echo "==================================="
