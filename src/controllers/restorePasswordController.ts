import { type Request, type Response } from 'express'
import { validateEmail } from '../util/utils'
import { logger } from '../log/logger'

import { findUserByEmail, updateUserPassword } from '../services/userService'
import { generateToken, decodeToken, hashPassword } from '../services/tokenService'
import { sendEmail } from '../services/emailSender'

export const sendPasswordRestoreTokenHandler = async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      status: 'Bad request',
      message: 'Email address not specified via request body or provided an invalid email'
    })
  }
  logger.debug(`Starting restore-password flow for user with email ${email}`)
  const userId = await findUserByEmail(email)
  if (userId) {
    logger.debug(`Found user with email ${email}. It's id is ${userId.toString()}`)
    const token = generateToken(userId.toString(), email)
    logger.debug(`Generated token: ${token}`)
    void sendEmail(email, token)
  }
  res.status(200).json({
    status: 'Success',
    message: `Password recovery email sended to ${email} if user with that email address exists`
  })
}

export const restorePasswordHandler = async (req: Request, res: Response) => {
  const { token } = req.params
  const { password } = req.body
  if (!token) {
    return res.status(400).json({
      status: 'Bad request',
      message: 'A valid token should be provided as Url param'
    })
  }
  if (!password) {
    return res.status(400).json({
      status: 'Bad request',
      message: 'Fields \'password\' should be provided within body request'
    })
  }
  try {
    const { userId, email } = decodeToken(token)
    logger.debug(`Decoded user details from token (id: ${userId}, email: ${email})`)
    await updateUserPassword(email, hashPassword(password))
    res.status(200).json({
      status: 'Success',
      message: 'Password updated'
    })
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'Unauthorized',
        message: 'Expired token provided'
      })
    }
    if ((err as Error).name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'Unauthorized',
        message: 'Invalid token provided'
      })
    }
    return res.status(500).json({
      status: 'Internal server error',
      message: 'Could not update password'
    })
  }
}
