import { NextFunction, Request, Response } from 'express'
export const WrappingErrorHandler = (controller: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}
