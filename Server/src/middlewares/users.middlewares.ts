import { Request, Response, NextFunction } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { httpStatusCode } from '~/constants/httpStatusCode'
import { userResponseMessage } from '~/constants/userMessage'
import { ErrorWithStatus } from '~/models/errors'
import databaseServices from '~/services/database.services'
import { verifySignedToken } from '~/services/jwtUtils'
import userService from '~/services/user.services'

const passwordSchema: ParamSchema = {
  in: ['body'],
  notEmpty: {
    errorMessage: userResponseMessage.VALIDATION_ERROR
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: 'Password is not strong enough (min 8 characters, 1 lowercase, 1 uppercase, 1 number, 1 symbol)'
  },
  trim: true,
  isString: true,
  isLength: {
    options: {
      min: 8,
      max: 20
    },
    errorMessage: userResponseMessage.PASSWORD_LENGTH
  }
}

const confirmPasswordSchema: ParamSchema = {
  in: ['body'],
  notEmpty: true,
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(userResponseMessage.PASSWORD_NOT_MATCH)
      }
      return true
    }
  },
  trim: true,
  isString: true,
  isLength: {
    options: {
      min: 8,
      max: 20
    },
    errorMessage: userResponseMessage.PASSWORD_LENGTH
  }
}

const checkForgotPasswordSchema: ParamSchema = {
  in: ['body'],
  notEmpty: {
    errorMessage: userResponseMessage.VALIDATION_ERROR
  },
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: userResponseMessage.TOKEN_INVALID,
          status: httpStatusCode.UNAUTHORIZED
        })
      }
      try {
        const decoded_forgot_password_token = await verifySignedToken({
          token: value,
          secret: process.env.SECRET_FORGOT_PASSWORD_TOKEN as string
        })
        const { userId } = decoded_forgot_password_token
        const user = await databaseServices.users.findOne({ _id: new ObjectId(userId) })
        if (user === null) {
          throw new ErrorWithStatus({
            message: userResponseMessage.USER_NOT_FOUND,
            status: httpStatusCode.UNAUTHORIZED
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: userResponseMessage.TOKEN_INVALID,
            status: httpStatusCode.UNAUTHORIZED
          })
        }
        req.decoded_forgot_password_token = decoded_forgot_password_token
      } catch (error) {
        throw new ErrorWithStatus({
          message: capitalize((error as JsonWebTokenError).message),
          status: httpStatusCode.UNAUTHORIZED
        })
      }

      return true
    }
  }
}

export const loginValidator = checkSchema({
  email: {
    in: ['body'],
    notEmpty: {
      errorMessage: userResponseMessage.VALIDATION_ERROR
    },
    isEmail: {
      errorMessage: userResponseMessage.EMAIL_INVALID
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        const user = await databaseServices.users.findOne({ email: value })
        if (user === null) {
          throw new Error(userResponseMessage.EMAIL_NOT_FOUND)
        }
        req.user = user
        return true
      }
    }
  },
  password: passwordSchema
})

export const registerValidator = checkSchema({
  email: {
    in: ['body'],
    notEmpty: {
      errorMessage: userResponseMessage.VALIDATION_ERROR
    },
    isEmail: {
      errorMessage: userResponseMessage.EMAIL_INVALID
    },
    trim: true,
    custom: {
      options: async (value) => {
        const emailExists = await userService.checkEmailExists(value)
        if (emailExists) {
          throw new ErrorWithStatus({ message: userResponseMessage.EMAIL_ALREADY_EXISTS, status: 400 })
        }
        return true
      }
    }
  },
  name: {
    in: ['body'],
    notEmpty: true,
    trim: true,
    isString: true,
    isLength: {
      options: {
        min: 3,
        max: 50
      },
      errorMessage: userResponseMessage.USER_NAME_LENGTH
    }
  },
  password: passwordSchema,
  confirm_password: confirmPasswordSchema,
  date_of_birth: {
    in: ['body'],
    notEmpty: true,
    isISO8601: {
      options: {
        strict: true,
        strictSeparator: true
      },
      errorMessage: userResponseMessage.DOB_ISO_8601
    },
    trim: true
  }
})

export const accessTokenValidation = checkSchema(
  {
    Authorization: {
      in: ['headers'],
      isString: true,
      custom: {
        options: async (value, { req }) => {
          const accessToken = (value || '').split(' ')[1]
          if (accessToken === '') {
            throw new ErrorWithStatus({ message: userResponseMessage.TOKEN_INVALID, status: 401 })
          }
          try {
            const decodedAccessToken = await verifySignedToken({
              token: accessToken,
              secret: process.env.SECRET_ACCESS_TOKEN_PASSWORD as string
            })
            if (!decodedAccessToken) {
              throw new ErrorWithStatus({ message: userResponseMessage.TOKEN_INVALID, status: 401 })
            }
            req.user = decodedAccessToken
            return true
          } catch (err) {
            if (err instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({ message: userResponseMessage.TOKEN_INVALID, status: 401 })
            }
            throw err
          }
        }
      }
    }
  },
  ['headers']
)

export const refreshTokenValidation = checkSchema(
  {
    refresh_token: {
      in: ['body'],
      notEmpty: {
        errorMessage: userResponseMessage.VALIDATION_ERROR
      },
      isString: true,
      custom: {
        options: async (value, { req }) => {
          try {
            const [decodedRefreshToken, refreshTokenExists] = await Promise.all([
              verifySignedToken({ token: value, secret: process.env.SECRET_REFRESH_TOKEN_PASSWORD as string }),
              databaseServices.refreshTokens.findOne({ token: value })
            ] as const)
            if (!refreshTokenExists) {
              throw new ErrorWithStatus({ message: userResponseMessage.TOKEN_INVALID, status: 401 })
            }
            req.user = decodedRefreshToken
            return true
          } catch (err) {
            if (err instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({ message: userResponseMessage.TOKEN_INVALID, status: 401 })
            }
            throw err
          }
        }
      }
    }
  },
  ['body']
)

export const emailVerifyTokenValidaton = checkSchema(
  {
    email_verify_token: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if (!value) {
            throw new ErrorWithStatus({
              message: userResponseMessage.EMAIL_VERIFIED,
              status: httpStatusCode.UNAUTHORIZED
            })
          }
          try {
            const decoded_email_verify_token = await verifySignedToken({
              token: value,
              secret: process.env.SECRET_EMAIL_VERIFY_TOKEN_PASSWORD as string
            })

            req.decoded_email_verify_token = decoded_email_verify_token
          } catch (error) {
            throw new ErrorWithStatus({
              message: capitalize((error as JsonWebTokenError).message),
              status: httpStatusCode.UNAUTHORIZED
            })
          }

          return true
        }
      }
    }
  },
  ['body']
)

export const forgotPasswordValidator = checkSchema(
  {
    email: {
      in: ['body'],
      notEmpty: {
        errorMessage: userResponseMessage.VALIDATION_ERROR
      },
      isEmail: {
        errorMessage: userResponseMessage.EMAIL_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const user = await databaseServices.users.findOne({ email: value })
          if (user === null) {
            throw new Error(userResponseMessage.EMAIL_NOT_FOUND)
          }
          req.user = user
          return true
        }
      }
    }
  },
  ['body']
)

export const verifyForgotPasswordValidator = checkSchema({
  forgot_password_token: checkForgotPasswordSchema
})

export const resetPasswordValidator = checkSchema({
  password: passwordSchema,
  confirm_password: confirmPasswordSchema,
  forgot_password_token: checkForgotPasswordSchema
})
