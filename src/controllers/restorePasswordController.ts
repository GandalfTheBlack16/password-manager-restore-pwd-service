import { type Request, type Response } from 'express'
import { validateEmail } from '../util/utils'
import { logger } from '../log/logger'

import { findUserByEmail, updateUserPassword } from '../services/userService'
import { hashPassword, generateToken, validateToken } from '../services/tokenService'
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
    const token = await generateToken(userId.toString())
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
    const userId = await validateToken(token)
    await updateUserPassword(userId, hashPassword(password))
    res.status(200).json({
      status: 'Success',
      message: 'Password updated'
    })
  } catch (err) {
    if ((err as Error).message.includes('Token has been already used')) {
      return res.status(400).json({
        status: 'Bad request',
        message: `Token ${token} has been already used`
      })
    }
    if ((err as Error).message.includes('Token cannot be used before')) {
      return res.status(401).json({
        status: 'Unauthorized',
        message: 'Invalid token\'s creation date'
      })
    }
    if ((err as Error).message.includes('Token is expired')) {
      return res.status(401).json({
        status: 'Unauthorized',
        message: 'Expired token provided'
      })
    }
    if ((err as Error).message.includes('Invalid token provided')) {
      return res.status(404).json({
        status: 'Not found',
        message: 'Provided token does not exists'
      })
    }
    return res.status(500).json({
      status: 'Internal server error',
      message: 'Could not update password'
    })
  }
}
