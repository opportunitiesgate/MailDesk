import { MongoClient } from "mongodb"

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

function getMongoClientPromise() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI is not configured")
  const client = new MongoClient(uri)
  const promise = global._mongoClientPromise ?? client.connect()
  if (process.env.NODE_ENV !== "production") global._mongoClientPromise = promise
  return promise
}

export const databaseName = process.env.MONGODB_DB_NAME || "mail-desk"
export async function getDatabase() {
  return (await getMongoClientPromise()).db(databaseName)
}

export type UserRole = "superadmin" | "admin"
export type MailDeskUser = {
  _id?: unknown
  name?: string
  email: string
  passwordHash: string
  role: UserRole
  active: boolean
}

export async function findUserByEmail(email: string) {
  const db = await getDatabase()
  return db.collection<MailDeskUser>("users").findOne({ email: email.toLowerCase(), active: true })
}

export async function ensureUsersCollection() {
  const db = await getDatabase()
  await db.collection("users").createIndex({ email: 1 }, { unique: true })
}
