import { config } from 'dotenv'
import winston, { format, transports } from 'winston'

config()

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: format.colorize(),
  transports: [
    new transports.Console({
      format: format.cli()
    })
  ]
})
