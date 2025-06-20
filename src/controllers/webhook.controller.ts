import { Request, Response, NextFunction } from 'express';

export class WebhookController {
  async canvaUninstall(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        type: 'SUCCESS'
      });
    } catch (error) {
      next(error);
    }
  }
}