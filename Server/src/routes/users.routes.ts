import express from 'express'
import {
  emailVerifyController,
  forgotPasswordController,
  getProfileController,
  loginController,
  logoutController,
  registerController,
  resetPasswordController,
  verifyForgotPasswordController
} from '~/controllers/users.controller'
import {
  accessTokenValidation,
  emailVerifyTokenValidaton,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidation,
  registerValidator,
  resetPasswordValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/users.middlewares'
import { validate } from '~/utils/validators'
const userRouters = express.Router()

userRouters.post('/login', validate(loginValidator), loginController)
userRouters.post('/register', validate(registerValidator), registerController)
userRouters.post('/logout', validate(accessTokenValidation), validate(refreshTokenValidation), logoutController)
userRouters.post('/verify-email', validate(emailVerifyTokenValidaton), emailVerifyController)
userRouters.post('/resend-email', validate(accessTokenValidation), emailVerifyController)
userRouters.post('/forgot-password', validate(forgotPasswordValidator), forgotPasswordController)
userRouters.post('/verify-forgot-password', validate(verifyForgotPasswordValidator), verifyForgotPasswordController)
userRouters.post('/reset-password', validate(resetPasswordValidator), resetPasswordController)
userRouters.get('/get-profile', validate(accessTokenValidation), getProfileController)

export default userRouters
