import { JwtPayload } from 'jsonwebtoken'
import { TokenTypes } from '~/constants/enums'

export interface RegisterRequestBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface VerifyForgotPasswordReqBody {
  forgot_password_token: string
}

export interface LoginRequestBody {
  email: string
  password: string
}

export interface ForgotPasswordRequestBody {
  email: string
}

export interface ResetPasswordRequestBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenTypes
}

export interface EmailVerifyToken {
  email_verify_token: string
}
