import { type Request, type Response } from 'express'
import { validateEmail } from '../util/utils'
import { logger } from '../log/logger'
import { findUserByEmail } from '../services/userService'
import { generateToken } from '../services/tokenService'
import { sendEmail } from '../services/emailSender'

export const sendPasswordRestoreToken = async (req: Request, res: Response) => {
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
    void sendEmail(email, token)
  }
  res.status(200).json({
    status: 'Success',
    message: `Password recovery email sended to ${email} if user with that email address exists`
  })
}
