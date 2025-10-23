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
  }
};

export default config;
