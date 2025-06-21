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
  
  // 安全的错误日志记录
  const logData: any = {
    message: err.message,
    statusCode,
    errorCode,
    url: req.url,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };

  // 只在开发环境记录敏感信息
  if (process.env.NODE_ENV === 'development') {
    logData.stack = err.stack;
    logData.details = err.details;
  }

  console.error('Error:', logData);

  // 客户端响应不包含敏感信息
  const clientMessage = statusCode >= 500 
    ? '服务器内部错误，请稍后再试' 
    : (err.message || '请求处理失败');

  const responseBody: any = {
    success: false,
    code: errorCode,
    message: clientMessage,
  };

  // 只在开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development' && statusCode < 500) {
    responseBody.details = err.details;
  }

  res.status(statusCode).json(responseBody);
};