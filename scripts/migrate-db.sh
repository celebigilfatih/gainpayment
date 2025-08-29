#!/bin/bash

# Bu script Docker ortamında veritabanı migrasyonlarını yönetir

set -e

echo "Veritabanı migrasyonları başlatılıyor..."

# Veritabanı bağlantısını kontrol et
until npx prisma db execute --stdin < /dev/null; do
  echo "Veritabanı bağlantısı bekleniyor..."
  sleep 2
done

# Migrasyonları uygula
echo "Migrasyonlar uygulanıyor..."
npx prisma migrate deploy

echo "Veritabanı migrasyonları tamamlandı."