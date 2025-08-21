# Usa una imagen oficial de Node.js con la versión requerida
FROM node:22.18.0-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo package.json y package-lock.json al contenedor
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del proyecto al contenedor
# COPY . .

# Expone el puerto (si estás ejecutando un servidor, como Vite)
EXPOSE 5173

# Comando por defecto (puedes cambiarlo según tus necesidades)
CMD ["npm", "run", "dev"]