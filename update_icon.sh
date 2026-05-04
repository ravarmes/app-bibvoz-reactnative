#!/bin/bash

# Script para atualizar o ícone do aplicativo
# Este script copia o arquivo assets/icon.png para os diretórios mipmap do Android
# com os tamanhos corretos para cada densidade de tela

echo "Atualizando ícones do aplicativo..."

# Copiar icon.png para os diretórios drawable e mipmap
cp assets/icon.png android/app/src/main/res/drawable/ic_launcher.png

# Você precisará instalar o ImageMagick para usar este script
# Se você não tiver o ImageMagick instalado, você pode fazer o redimensionamento manualmente
# ou instalar com 'apt-get install imagemagick' ou 'brew install imagemagick'

if command -v convert &> /dev/null; then
    # Redimensionar para mipmap-mdpi (48x48)
    convert assets/icon.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
    convert assets/icon.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png

    # Redimensionar para mipmap-hdpi (72x72)
    convert assets/icon.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
    convert assets/icon.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png

    # Redimensionar para mipmap-xhdpi (96x96)
    convert assets/icon.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
    convert assets/icon.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png

    # Redimensionar para mipmap-xxhdpi (144x144)
    convert assets/icon.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
    convert assets/icon.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png

    # Redimensionar para mipmap-xxxhdpi (192x192)
    convert assets/icon.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
    convert assets/icon.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

    echo "Ícones redimensionados e copiados com sucesso!"
else
    echo "ImageMagick não encontrado. Por favor, copie e redimensione os ícones manualmente."
    echo "Você pode instalar o ImageMagick com 'apt-get install imagemagick' ou 'brew install imagemagick'."
fi

echo "Nota: Para aplicar os novos ícones, você precisará reconstruir o aplicativo."
echo "Execute 'cd android && ./gradlew clean assembleDebug' ou use o Android Studio." 