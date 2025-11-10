FROM n8nio/n8n:latest

# Variables de entorno por defecto (se sobreescriben con Railway)
ENV N8N_PORT=5678
ENV N8N_PROTOCOL=https
ENV DB_TYPE=postgresdb

# Crear directorio para workflows
RUN mkdir -p /home/node/.n8n/workflows

# Copiar workflows al contenedor
COPY workflows/*.json /home/node/.n8n/workflows/

# Copiar migraciones (por si se necesitan)
COPY migrations /home/node/migrations

# Exponer puerto
EXPOSE 5678