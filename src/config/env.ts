import dotenv from 'dotenv';
dotenv.config();

export const config = {
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECTDB_URL,
  port: Number(process.env.PORT),
  jwtAccessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
  jwtRefreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
  jwtAccessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  jwtRefreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  encryptionKey: process.env.ENCRYPTION_KEY,
  hermesBaseUrl: process.env.HERMES_BASE_URL || 'https://api.hermesworld.co.uk',
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
  cognitoClientId: process.env.COGNITO_CLIENT_ID,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
