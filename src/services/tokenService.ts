import jwt, { type JwtPayload } from 'jsonwebtoken'
import { pbkdf2Sync } from 'crypto'
import { logger } from '../log/logger'

const secret = process.env.JWT_SECRET ?? '0000000000'
const salt = process.env.PASSWORD_SALT ?? '00000000'

export const generateToken = (userId: string, email: string) => {
  logger.debug(`Generating token for user ${userId}`)
  return jwt.sign({ userId, email }, secret, {
    expiresIn: '10m'
  })
}

export const decodeToken = (token: string): JwtPayload => {
  logger.debug(`Decoding token ${token}`)
  return jwt.verify(token, secret) as JwtPayload
}

export const hashPassword = (password: string): string => {
  return pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
}
