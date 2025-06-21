import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import prisma from '../lib/prisma';

interface JWTPayload {
  userId: number;
  email?: string;
  provider?: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        code: 4012,
        message: 'Access Token 无效或已过期',
      });
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.accessTokenSecret) as JWTPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          code: 4012,
          message: 'Access Token 无效或已过期',
        });
        return;
      }

      (req as any).user = user;
      (req as any).userId = user.id;
      next();
    } catch (jwtError) {
      // TODO: Implement Canva JWT verification
      res.status(401).json({
        success: false,
        code: 4012,
        message: 'Access Token 无效或已过期',
      });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      code: 4012,
      message: 'Access Token 无效或已过期',
    });
    return;
  }
};