import jwt, { type JwtPayload } from 'jsonwebtoken'
import { logger } from '../log/logger'

const secret = process.env.JWT_SECRET ?? '0000000000'

export const generateToken = (userId: string, email: string) => {
  logger.debug(`Generating token for user ${userId}`)
  return jwt.sign({ userId, email }, secret, {
    expiresIn: '10m'
  })
}

export const decodeToken = (token: string) => {
  logger.debug(`Decoding token ${token}`)
  return jwt.verify(token, secret) as JwtPayload
}
