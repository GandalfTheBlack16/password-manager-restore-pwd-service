import { config } from 'dotenv'
import { logger } from '../log/logger'

config()

const expirationTime = process.env.RESTORE_TOKEN_EXPIRATION ?? '30'
const rootWebPage = process.env.ROOT_WEBPAGE ?? 'http://localhost:5173'

export const sendEmail = async (emailAddress: string, token: string) => {
  logger.info(`Sending password recover email to ${emailAddress}`)
  const endpoint = process.env.SEND_EMAIL_SERVICE_ENDPOINT ?? 'http://localhost:3000/email'
  const recipients = [emailAddress]
  const subject = 'Account Password Reset'
  const content = setHtmlContent(token)
  const headers = new Headers()
  headers.set('Content-type', 'application/json')
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recipients,
        subject,
        content
      })
    })
    const data = await response.json()
    logger.debug(JSON.stringify(data))
    if (!response.ok) {
      logger.debug(JSON.stringify(response))
      if (response.status === 404) {
        logger.warn(`Could not send email because of invalid recipients: ${data.adresses}`)
      } else {
        logger.warn(`Could not send email: ${data.message}`)
      }
    }
    if (response.status === 206) {
      logger.warn(`Email sended to ${data.accepted} but cannot deliver to ${data.rejected}`)
      return
    }
    logger.info(`Email sended to ${data.addresses}`)
  } catch (error) {
    logger.warn(`Could not send email: ${JSON.stringify(error as Error)}`)
  }
}

const setHtmlContent = (token: string): string => {
  const linkHref = `${rootWebPage}/restore-password/${token}`
  return `
  <div style="background-color: #133d64; color: white; padding: 2rem; font-family: Poppins,sans-serif; width: fit-content; border-radius: 10px;">
    <img src="${rootWebPage}/assets/logo-no-background-0210caf7.png" alt="password-manager-logo" width="350px">
    <h2 style="margin-bottom: 2rem;">Someone just requested to reset the password on your account. If this was you, click on the next button to change it.</h2>
    <a href="${linkHref}" target="_blank" style="width: fit-content; padding: 0.8rem 2rem; font-size: medium; color: #f5f5f5; background-color: #31618f; border: none; border-radius: 20px; margin: auto; text-decoration: none;">
      Reset password
    </a>
    <div style="margin-top: 2rem;">
      <h4>This link will expire within ${expirationTime} minutes.</h4>
      <h4>If you don't want to reset your password, just ignore this message and nothing will be changed.</h4>
    </div>
  </div>
    `
}
