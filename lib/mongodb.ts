import { MongoClient, Db } from "mongodb"

declare global {
  var sightMongoClientPromise: Promise<MongoClient> | undefined
}

let database: Db | null = null

function connectionPromise() {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) throw new Error("MONGODB_URI is not configured")

  if (!global.sightMongoClientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 20, minPoolSize: 0, serverSelectionTimeoutMS: 8000 })
    global.sightMongoClientPromise = client.connect().catch((error) => {
      global.sightMongoClientPromise = undefined
      throw error
    })
  }
  return global.sightMongoClientPromise
}

export async function getDb(): Promise<Db> {
  if (database) return database
  const client = await connectionPromise()
  database = client.db(process.env.MONGODB_DB?.trim() || undefined)
  return database
}

export async function checkDatabaseConnection() {
  const db = await getDb()
  await db.command({ ping: 1 })
  return { database: db.databaseName }
}
