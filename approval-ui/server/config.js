import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultEnvPath = path.resolve(__dirname, '..', '..', '.env');

// Allow overriding the env path but always fall back to the repository .env if available.
const envPaths = [
  process.env.APPROVAL_UI_ENV_PATH,
  defaultEnvPath
].filter(Boolean);

for (const envPath of envPaths) {
  dotenv.config({ path: envPath, override: false });
}

const wpBaseUrl = (process.env.WP_BASE_URL || '').replace(/\/$/, '');
const wpUser = process.env.WP_APP_USER || null;
const wpPassword = process.env.WP_APP_PASSWORD || null;
const inferredMediaEndpoint = wpBaseUrl ? `${wpBaseUrl}/wp-json/wp/v2/media` : null;
const basicAuthHeader = process.env.WORDPRESS_AUTH_HEADER
  || (wpUser && wpPassword ? `Basic ${Buffer.from(`${wpUser}:${wpPassword}`).toString('base64')}` : null);

const config = {
  apiPort: Number(process.env.APPROVAL_API_PORT || process.env.APP_PORT || process.env.PORT || 3001),
  frontendBuildDir: path.resolve(__dirname, '..', 'dist'),
  database: {
    host: process.env.PGHOST || process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.PGPORT || process.env.POSTGRES_PORT || 5432),
    user: process.env.PGUSER || process.env.POSTGRES_USER || 'marketai_user',
    password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || 'marketai_secure_password',
    database: process.env.PGDATABASE || process.env.POSTGRES_DB || 'marketai_seo',
    ssl: process.env.PGSSL === 'true'
  },
  n8n: {
    baseUrl:
      process.env.N8N_WEBHOOK_BASE
      || `${process.env.N8N_PROTOCOL || 'http'}://${process.env.N8N_HOST || 'localhost'}:${process.env.N8N_PORT || 5678}/webhook`,
    timeoutMs: Number(process.env.N8N_TIMEOUT_MS || 120000),
    basicAuth: {
      user: process.env.N8N_BASIC_AUTH_USER || null,
      password: process.env.N8N_BASIC_AUTH_PASSWORD || null
    }
  },
  wordpress: {
    baseUrl: wpBaseUrl || null,
    mediaEndpoint: process.env.WORDPRESS_MEDIA_ENDPOINT || inferredMediaEndpoint,
    authHeader: basicAuthHeader,
    nonce: process.env.WORDPRESS_NONCE || null,
    updateAlt: process.env.WORDPRESS_UPDATE_ALT !== 'false'
  }
};

export default config;
