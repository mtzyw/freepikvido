import dotenv from 'dotenv';

dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || '',
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  cloudflareR2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || '',
    publicUrl: process.env.R2_PUBLIC_URL || '',
  },
  
  freepik: {
    apiUrl: process.env.FREEPIK_API_URL || '',
    webhookUrl: process.env.FREEPIK_WEBHOOK_URL || '',
  },
  
  canva: {
    jwksUrl: process.env.CANVA_JWKS_URL || 'https://api.canva.com/.well-known/jwks.json',
    appId: process.env.CANVA_APP_ID || '',
  },
  
  apple: {
    bundleId: process.env.APPLE_BUNDLE_ID || '',
    sharedSecret: process.env.APPLE_SHARED_SECRET || '',
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
};

export default config;