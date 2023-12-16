import { pbkdf2Sync, randomBytes } from 'crypto'
import { connectMongoClient, disconnectMongoClient } from '../db/mongoClient'
import { logger } from '../log/logger'
import { type RestoreToken } from '../model/RestoreToken'

const salt = process.env.PASSWORD_SALT ?? '00000000'
const expMinutes = Number(process.env.RESTORE_TOKEN_EXPIRATION) ?? 30

export const generateToken = async (userId: string): Promise<string> => {
  logger.debug(`Creating a token for user ${userId}`)
  const mongoClient = await connectMongoClient()
  const collection = mongoClient
    .db(process.env.MONGO_DATABASE)
    .collection(process.env.MONGO_TOKEN_COLLECTION ?? 'restore-tokens')
  const token: RestoreToken = {
    token: randomBytes(16).toString('hex'),
    userId,
    createdAt: new Date(),
    expireAt: new Date(new Date().getTime() + expMinutes * 60000),
    enabled: true
  }
  try {
    await collection.insertOne(token)
    await disconnectMongoClient()
    return token.token
  } catch (error) {
    logger.error(`Error inserting token: ${(error as Error).stack}`)
    throw error
  }
}

export const validateToken = async (tokenId: string): Promise<string> => {
  logger.debug(`Validating token ${tokenId}`)
  const mongoClient = await connectMongoClient()
  const collection = mongoClient
    .db(process.env.MONGO_DATABASE)
    .collection(process.env.MONGO_TOKEN_COLLECTION ?? 'restore-tokens')
  try {
    const document = await collection.findOne({ token: tokenId })
    if (!document) {
      throw Error('Invalid token provided')
    }
    const { enabled, userId, createdAt, expireAt } = document
    const currentDate = new Date()
    if (!enabled) {
      throw Error('Token has been already used')
    }
    if (currentDate.getTime() < createdAt.getTime()) {
      throw Error(`Token cannot be used before ${createdAt}`)
    }
    if (currentDate.getTime() > expireAt.getTime()) {
      throw Error('Token is expired')
    }
    await collection.findOneAndUpdate({ token: tokenId }, { $set: { enabled: false } })
    await disconnectMongoClient()
    return userId
  } catch (error) {
    logger.error(`Error validating token ${(error as Error).stack}`)
    throw error
  }
}

export const hashPassword = (password: string): string => {
  return pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
}
