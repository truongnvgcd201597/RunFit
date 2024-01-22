import { sign, SignOptions } from 'jsonwebtoken'

export const createSignedToken = async ({
  payload,
  secret = process.env.JWT_SECRET_KEY as string,
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
