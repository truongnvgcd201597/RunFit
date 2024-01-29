import { sign, SignOptions, verify } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'

export const createSignedToken = async ({
  payload,
  secret = process.env.SECRET_ACCESS_TOKEN_PASSWORD as string,
  options
}: {
  payload: string | object | Buffer
  secret?: string
  options: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    sign(payload, secret, options, (err, token) => {
      if (err) {
        reject(err)
      }
      resolve(token as string)
    })
  })
}

export const verifySignedToken = async ({ token, secret }: { token: string; secret: string }) => {
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err)
      }
      resolve(decoded as jwt.JwtPayload)
    })
  })
}
