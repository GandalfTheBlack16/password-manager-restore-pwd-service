import { config } from 'dotenv'
import express, { json } from 'express'
import { logger } from './log/logger'
import { sendPasswordRestoreTokenHandler, restorePasswordHandler } from './controllers/restorePasswordController'

config()

const app = express()

app.use(json())

app.post('/restore-password', sendPasswordRestoreTokenHandler)

app.put('/restore-password/:token', restorePasswordHandler)

app.listen(process.env.PORT, () => {
  logger.info(`Express application running on port ${process.env.PORT}`)
})
