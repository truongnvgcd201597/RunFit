import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import userService from '~/services/user.services'

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required'
    })
  }
  next()
}

export const registerValidator = checkSchema({
  email: {
    in: ['body'],
    notEmpty: true,
    isEmail: {
      errorMessage: 'Email is invalid'
    },
    trim: true,
    custom: {
      options: async (value) => {
        const isExistEmail = await userService.checkEmailExists(value)
        if (isExistEmail) {
          throw new Error('Email already exists')
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
      errorMessage: 'Name must be between 3 and 50 characters'
    }
  },
  password: {
    in: ['body'],
    notEmpty: true,
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
      errorMessage: 'Password must be between 8 and 20 characters'
    }
  },
  confirm_password: {
    in: ['body'],
    notEmpty: true,
    custom: {
      options: (value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password')
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
      errorMessage: 'Password confirmation must be between 8 and 20 characters'
    }
  },
  date_of_birth: {
    in: ['body'],
    notEmpty: true,
    isISO8601: {
      options: {
        strict: true,
        strictSeparator: true
      },
      errorMessage: 'Date of birth is invalid (ISO 8601)'
    },
    trim: true
  }
})
