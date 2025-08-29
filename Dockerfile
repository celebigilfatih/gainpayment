FROM node:18-alpine

WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package.json package-lock.json ./
RUN npm ci

# Uygulama kodunu kopyala
COPY . .

# Prisma istemcisini oluştur
RUN npx prisma generate

# Uygulamayı derle
RUN npm run build

# Uygulamayı çalıştır
CMD ["npm", "run", "start"]