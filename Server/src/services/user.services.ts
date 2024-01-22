import User from '~/models/schema/users.schema'
import databaseServices from './database.services'
import { RegisterRequestBody } from '~/models/users.requests'
import { encryptPassword } from './hashPassword'
import { createSignedToken } from './jwtUtils'
import { TokenTypes } from '~/constants/enums'

class UserService {
  private createAccessToken(userId: string) {
    return createSignedToken({
      payload: { userId, token_type: TokenTypes.AccessToken },
      options: {
        algorithm: 'HS256',
        expiresIn: '1d'
      }
    })
  }
  private createRefreshToken(userId: string) {
    return createSignedToken({
      payload: { userId },
      options: {
        algorithm: 'HS256',
        expiresIn: '7d'
      }
    })
  }
  async register(payload: RegisterRequestBody) {
    const result = await databaseServices.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: encryptPassword(payload.password)
      })
    )

    const getuserInsertedId = result.insertedId.toString()

    const [accessToken, refreshToken] = await Promise.all([
      this.createAccessToken(getuserInsertedId),
      this.createRefreshToken(getuserInsertedId)
    ])

    return {
      accessToken,
      refreshToken
    }
  }

  async checkEmailExists(email: string) {
    const result = await databaseServices.users.findOne({ email })
    return Boolean(result)
  }
}

const userService = new UserService()
export default userService
