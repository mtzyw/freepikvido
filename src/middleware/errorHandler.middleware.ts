import { Request, Response, NextFunction } from 'express';

interface ApiError extends Error {
  statusCode?: number;
  code?: number;
  details?: any;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 5000;
  
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    errorCode,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    code: errorCode,
    message: err.message || '服务器内部错误，请稍后再试',
    details: err.details || undefined,
  });
};