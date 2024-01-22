import { Request, Response } from 'express'
import userService from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterRequestBody } from '~/models/users.requests'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'truongnvgcd201597@gmail.com' && password === 'truongnvgcd201597') {
    res.json({ message: 'Login success' })
  } else {
    res.json({ message: 'Login fail' })
  }
}

export const registerController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  try {
    const result = await userService.register(req.body as RegisterRequestBody)

    return res.json({ message: 'Register success', data: result })
  } catch (err) {
    console.log(err)

    return res.status(400).json({ message: 'Register fail', error: err })
  }
}
