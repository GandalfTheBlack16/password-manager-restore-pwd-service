import { connectMongoClient, disconnectMongoClient } from '../db/mongoClient'
import { logger } from '../log/logger'
import { type ObjectId } from 'mongodb'

export const findUserByEmail = async (email: string) => {
  logger.debug(`Finding user with email ${email}`)
  const mongoClient = await connectMongoClient()
  const collection = mongoClient
    .db(process.env.MONGO_DATABASE)
    .collection(process.env.MONGO_COLLECTION ?? 'users')
  const user = await collection.findOne({ email })
  await disconnectMongoClient()
  if (!user) {
    logger.debug(`User with email ${email} does not exist`)
    return null
  }
  return user._id
}

export const updateUserPassword = async (userId: string, password: string) => {
  logger.debug(`Updating password for user ${userId}`)
  const mongoClient = await connectMongoClient()
  const collection = mongoClient
    .db(process.env.MONGO_DATABASE)
    .collection(process.env.MONGO_COLLECTION ?? 'users')
  try {
    await collection.findOneAndUpdate({ _id: userId as unknown as ObjectId }, { $set: { password } })
    await disconnectMongoClient()
  } catch (error) {
    logger.error(`Error updating password: ${(error as Error).stack}`)
    throw error
  }
}
