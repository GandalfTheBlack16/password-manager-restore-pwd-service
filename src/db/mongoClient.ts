import { config } from 'dotenv'
import { MongoClient } from 'mongodb'
import { logger } from '../log/logger'

config()

const mongoUrl = process.env.MONGO_URL ?? 'mongodb://localhost:27017'
const mongoUser = process.env.MONGO_USER
const mongoPassword = process.env.MONGO_PWD

const mongoClient = new MongoClient(mongoUrl, {
  auth: {
    username: mongoUser,
    password: mongoPassword
  }
})

export async function connectMongoClient () {
  await mongoClient.connect()
  logger.debug(`Connected to Mongo databse ${mongoUrl}`)
  return mongoClient
}

export async function disconnectMongoClient () {
  await mongoClient.close()
  logger.debug(`Disconnected from Mongo databse ${mongoUrl}`)
}
