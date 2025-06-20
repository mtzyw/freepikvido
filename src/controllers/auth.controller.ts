import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

interface ApiError extends Error {
  statusCode?: number;
  code?: number;
}

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      const result = await this.authService.register({
        email,
        password,
        name,
      });

      res.status(200).json({
        success: true,
        message: '注册成功',
        data: {
          user_id: result.user.id,
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        },
      });
    } catch (error) {
      const apiError = error as ApiError;
      apiError.statusCode = 400;
      apiError.code = 4001;
      next(apiError);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login({
        email,
        password,
      });

      res.status(200).json({
        success: true,
        message: '登录成功',
        data: {
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
          },
        },
      });
    } catch (error) {
      const apiError = error as ApiError;
      apiError.statusCode = 401;
      apiError.code = 4010;
      next(apiError);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;

      const result = await this.authService.refreshAccessToken(refresh_token);

      res.status(200).json({
        success: true,
        message: 'Access Token 刷新成功',
        data: {
          access_token: result.accessToken,
        },
      });
    } catch (error) {
      const apiError = error as ApiError;
      apiError.statusCode = 401;
      apiError.code = 4012;
      next(apiError);
    }
  }

  async oauthLogin(_req: Request, res: Response, next: NextFunction) {
    try {
      res.status(501).json({
        success: false,
        code: 5000,
        message: 'OAuth login 功能暂未实现',
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(_req: Request, res: Response, next: NextFunction) {
    try {
      res.status(501).json({
        success: false,
        code: 5000,
        message: '忘记密码功能暂未实现',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(_req: Request, res: Response, next: NextFunction) {
    try {
      res.status(501).json({
        success: false,
        code: 5000,
        message: '重置密码功能暂未实现',
      });
    } catch (error) {
      next(error);
    }
  }
}