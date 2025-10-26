# Utiliser l'image officielle Node.js 22 (dernière version stable)
FROM node:22-alpine

# Installer pnpm globalement
RUN npm install -g pnpm@9.12.2

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . .

# Changer le propriétaire des fichiers
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port de développement Vite
EXPOSE 5173

# Commande par défaut pour le développement
CMD ["pnpm", "run", "dev"]
