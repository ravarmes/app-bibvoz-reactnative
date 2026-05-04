#!/bin/bash

# Script para compilar um APK otimizado para tamanho
echo "Iniciando compilação de APK otimizado..."

# Limpar build anterior
echo "Limpando builds anteriores..."
cd android && ./gradlew clean

# Compilar versão de release otimizada
echo "Compilando APK de release otimizado..."
./gradlew assembleRelease

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "Compilação concluída com sucesso!"
    
    # Mostrar o caminho para os APKs gerados
    echo "APKs gerados:"
    
    # Listar os APKs por arquitetura
    find app/build/outputs/apk/release -name "*.apk" -type f -exec du -h {} \;
    
    echo ""
    echo "Para instalar um APK específico no seu dispositivo:"
    echo "adb install -r [CAMINHO_DO_APK]"
    echo ""
    echo "Exemplo para arm64-v8a (maioria dos dispositivos modernos):"
    find app/build/outputs/apk/release -name "*arm64-v8a*.apk" -type f | xargs -I{} echo "adb install -r {}"
else
    echo "Falha na compilação. Verifique os erros acima."
fi

cd .. 