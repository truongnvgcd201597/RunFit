import { NextFunction, Request, Response } from 'express'
import userService from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  EmailVerifyToken,
  ForgotPasswordRequestBody,
  LoginRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
  TokenPayload,
  VerifyForgotPasswordReqBody
} from '~/models/users.requests'
import { userResponseMessage } from '~/constants/userMessage'
import User from '~/models/schema/users.schema'
import { ObjectId } from 'mongodb'
import databaseServices from '~/services/database.services'
import { httpStatusCode } from '~/constants/httpStatusCode'
import { UserVerifyStatus } from '~/constants/enums'

export const loginController = async (
  req: Request<ParamsDictionary, any, LoginRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userService.login(user_id.toString())

  return res.json({
    message: userResponseMessage.LOGIN_SUCCESS,
    data: result
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await userService.register(req.body as RegisterRequestBody)

  return res.json({ message: 'Register success', data: result })
}

export const logoutController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { refresh_token } = req.body
  await userService.logout(refresh_token)

  return res.json({ message: userResponseMessage.LOGOUT_SUCCESS })
}

export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, EmailVerifyToken>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseServices.users.findOne({
    _id: new ObjectId(user_id)
  })
  // Nếu không tìm thấy user thì mình sẽ báo lỗi
  if (!user) {
    return res.status(httpStatusCode.BAD_REQUEST).json({
      message: userResponseMessage.USER_NOT_FOUND
    })
  }
  // Đã verify rồi thì mình sẽ không báo lỗi
  // Mà mình sẽ trả về status OK với message là đã verify trước đó rồi
  if (user.email_verify_token === '') {
    return res.json({
      message: userResponseMessage.EMAIL_VERIFIED
    })
  }
  const result = await userService.verifyEmail(user_id)
  return res.json({
    message: userResponseMessage.EMAIL_VERIFIED,
    result
  })
}

export const resendEmailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseServices.users.findOne({
    _id: new ObjectId(user_id)
  })
  if (!user) {
    return res.status(httpStatusCode.BAD_REQUEST).json({
      message: userResponseMessage.USER_NOT_FOUND
    })
  }
  if (user.email_verify_token === '' || user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: userResponseMessage.EMAIL_VERIFIED
    })
  }
  const result = await userService.resendVerifyEmail(user_id)
  return res.json({
    result
  })
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id } = req.user as User

  const result = await userService.forgotPassword(new ObjectId(_id).toString())
  return res.json({
    message: userResponseMessage.FORGOT_PASSWORD_SUCCESS,
    result
  })
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  return res.json({
    message: userResponseMessage.FORGOT_PASSWORD_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const user = await databaseServices.users.findOne({ _id: new ObjectId(userId) })
  if (user === null) {
    return res.status(httpStatusCode.BAD_REQUEST).json({
      message: userResponseMessage.USER_NOT_FOUND
    })
  }
  const result = await userService.resetPassword(userId, password)
  return res.json({
    result
  })
}

export const getProfileController = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.user as TokenPayload
  const user = await userService.getProfile(userId)
  if (user === null) {
    return res.status(httpStatusCode.BAD_REQUEST).json({
      message: userResponseMessage.USER_NOT_FOUND
    })
  }
  return res.json({
    message: userResponseMessage.GET_PROFILE_SUCCESS,
    data: user
  })
}
