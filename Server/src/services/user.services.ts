import User from '~/models/schema/users.schema'
import databaseServices from './database.services'
import { RegisterRequestBody } from '~/models/users.requests'
import { encryptPassword } from './hashPassword'
import { createSignedToken } from './jwtUtils'
import { TokenTypes, UserVerifyStatus } from '~/constants/enums'
import RefreshToken from '~/models/schema/refreshToken.schema'
import { ObjectId } from 'mongodb'
import { userResponseMessage } from '~/constants/userMessage'

class UserService {
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.createAccessToken(user_id), this.createRefreshToken(user_id)])
  }
  private createAccessToken(userId: string) {
    return createSignedToken({
      payload: { userId, token_type: TokenTypes.AccessToken },
      secret: process.env.SECRET_ACCESS_TOKEN_PASSWORD as string,
      options: {
        algorithm: 'HS256',
        expiresIn: '1d'
      }
    })
  }
  private createRefreshToken(userId: string) {
    return createSignedToken({
      payload: { userId },
      secret: process.env.SECRET_REFRESH_TOKEN_PASSWORD as string,
      options: {
        algorithm: 'HS256',
        expiresIn: '7d'
      }
    })
  }

  private createForgotPasswordToken(userId: string) {
    return createSignedToken({
      payload: { userId },
      secret: process.env.SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        algorithm: 'HS256',
        expiresIn: '3d'
      }
    })
  }
  async register(payload: RegisterRequestBody) {
    const user_id = new ObjectId().toString()
    const signEmailToken = await this.createVerifyEmailToken(user_id)
    await databaseServices.users.insertOne(
      new User({
        ...payload,
        _id: new ObjectId(user_id),
        date_of_birth: new Date(payload.date_of_birth),
        password: encryptPassword(payload.password),
        email_verify_token: signEmailToken
      })
    )
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(user_id)
    databaseServices.refreshTokens.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refreshToken }))

    return {
      accessToken,
      refreshToken
    }
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)

    databaseServices.refreshTokens.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token }))
    return {
      access_token,
      refresh_token
    }
  }

  async checkEmailExists(email: string) {
    const result = await databaseServices.users.findOne({ email })
    return Boolean(result)
  }

  async checkPasswordCorrect(email: string, password: string) {
    const result = await databaseServices.users.findOne({ email })
    return Boolean(result && result.password === encryptPassword(password))
  }

  async logout(refresh_token: string) {
    await databaseServices.refreshTokens.deleteOne({ token: refresh_token })
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken(user_id),
      databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified,
            updated_at: '$$NOW'
          }
        }
      ])
    ])
    const [access_token, refresh_token] = token
    return {
      access_token,
      refresh_token
    }
  }

  async createVerifyEmailToken(user_id: string) {
    return createSignedToken({
      payload: { user_id, token_type: TokenTypes.EmailVerificationToken },
      secret: process.env.SECRET_EMAIL_VERIFY_TOKEN_PASSWORD as string,
      options: {
        algorithm: 'HS256',
        expiresIn: '1d'
      }
    })
  }

  async resendVerifyEmail(user_id: string) {
    databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token: await this.createVerifyEmailToken(user_id),
          updated_at: '$$NOW'
        }
      }
    ])

    return {
      message: userResponseMessage.EMAIL_VERIFIED
    }
  }

  async forgotPassword(userId: string) {
    const result = await this.createForgotPasswordToken(userId)
    databaseServices.users.updateOne({ _id: new ObjectId(userId) }, [
      {
        $set: {
          forgot_password_token: result,
          updated_at: '$$NOW'
        }
      }
    ])
    return result
  }

  async verifyForgotPasswordToken(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          updated_at: '$$NOW'
        }
      }
    ])
  }

  async resetPassword(userId: string, password: string) {
    databaseServices.users.updateOne({ _id: new ObjectId(userId) }, [
      {
        $set: {
          password: encryptPassword(password),
          forgot_password_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    return {
      message: userResponseMessage.RESET_PASSWORD_SUCCESS
    }
  }
  async getProfile(userId: string) {
    const user = await databaseServices.users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { _id: 0, password: 0, email_verify_token: 0, forgot_password_token: 0 } }
    )
    return user
  }
}

const userService = new UserService()
export default userService
