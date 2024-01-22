import express from 'express'
import { loginController, registerController } from '~/controllers/users.controller'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { validate } from '~/utils/validators'
const userRouters = express.Router()

userRouters.post('/login', loginValidator, loginController)
userRouters.post('/register', validate(registerValidator), registerController)

export default userRouters
