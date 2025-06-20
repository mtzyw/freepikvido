import jwt from 'jsonwebtoken';
import config from '../config';

interface TokenPayload {
  userId: number;
  email?: string;
  provider?: string;
}

export const generateTokens = (payload: TokenPayload) => {
  if (!config.jwt.accessTokenSecret || !config.jwt.refreshTokenSecret) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    payload,
    config.jwt.accessTokenSecret,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    payload,
    config.jwt.refreshTokenSecret,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  if (!config.jwt.accessTokenSecret) {
    throw new Error('JWT access token secret not configured');
  }
  return jwt.verify(token, config.jwt.accessTokenSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  if (!config.jwt.refreshTokenSecret) {
    throw new Error('JWT refresh token secret not configured');
  }
  return jwt.verify(token, config.jwt.refreshTokenSecret) as TokenPayload;
};