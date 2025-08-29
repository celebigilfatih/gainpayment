# Gain Payment - Finansal Yönetim Uygulaması

Gain Payment, finansal danışmanların müşteri portföylerini, yatırımlarını ve işlemlerini takip etmelerine olanak sağlayan bir web uygulamasıdır.

## Özellikler

### Müşteri Yönetimi
- Müşteri profilleri oluşturma ve düzenleme
- Müşteri nakit pozisyonlarını takip etme
- Müşteri listesi ve detaylı müşteri görünümü

### Yatırım Takibi
- Müşteri bazlı yatırım kayıtları
- Hisse senedi bilgileri (isim, sembol)
- Yatırım miktarı ve maliyet takibi
- Güncel değer ve kâr/zarar hesaplaması

### İşlem Kaydı
- Alım/satım işlemlerinin kaydı
- İşlem tarihçesi ve detayları
- İşlem bazında miktar ve fiyat takibi

### Dashboard
- Genel bakış ve özet bilgiler
- Toplam müşteri, yatırım ve işlem sayıları
- Toplam portföy değeri ve kâr/zarar durumu
- Son eklenen müşteriler ve son işlemler

### Güvenlik
- Kullanıcı kimlik doğrulama
- Oturum yönetimi
- Veri erişim kontrolü

## Teknolojiler

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Veritabanı**: PostgreSQL (Prisma ORM)
- **Kimlik Doğrulama**: NextAuth.js
- **Konteynerizasyon**: Docker, Docker Compose

## Kurulum

### Gereksinimler

- Node.js (v18 veya üzeri)
- npm veya yarn
- PostgreSQL veritabanı
- Docker ve Docker Compose (konteynerize kurulum için)

### Docker ile Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone <repo-url>
   cd gainpayment
   ```

2. Docker konteynerlerini oluşturun ve başlatın:
   ```bash
   npm run docker:build
   npm run docker:up
   ```

3. Uygulama http://localhost:3000 adresinde çalışacaktır.

### Geliştirme Ortamında Kurulum

1. PostgreSQL'i Docker ile başlatın (opsiyonel):
   ```bash
   docker-compose up db -d
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Prisma istemcisini oluşturun:
   ```bash
   npm run prisma:generate
   ```

4. Migrasyonları uygulayın:
   ```bash
   npx prisma migrate dev
   ```

5. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

### Veritabanı Yönetimi

Prisma Studio ile veritabanını görüntülemek için:

```bash
npm run prisma:studio
```

### Docker Komutları

- Konteynerleri başlatmak: `npm run docker:up`
- Konteynerleri durdurmak: `npm run docker:down`
- Konteynerleri yeniden oluşturmak: `npm run docker:build`

### Manuel Kurulum Adımları

1. Repoyu klonlayın:
   ```bash
   git clone https://github.com/yourusername/gainpayment.git
   cd gainpayment
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   # veya
   yarn install
   ```

3. `.env` dosyasını oluşturun:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/gainpayment"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Veritabanı şemasını oluşturun:
   ```bash
   npx prisma migrate dev --name init
   # veya
   yarn prisma migrate dev --name init
   ```

5. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   # veya
   yarn dev
   ```

6. Tarayıcınızda `http://localhost:3000` adresine gidin.

## Kullanım

1. Kayıt olun veya giriş yapın
2. Dashboard üzerinden müşteri ekleyin
3. Müşteri profilinden yatırım ekleyin
4. Yatırımlar için alım/satım işlemleri kaydedin
5. Dashboard ve listeleme sayfalarından genel durumu takip edin

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
