import { EventEmitter } from 'events'
import MongodbMemoryServer from 'mongodb-memory-server'
import mongoose from '../src/services/mongoose'

const mongoServer = new MongodbMemoryServer()

EventEmitter.defaultMaxListeners = Infinity
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

global.Array = Array
global.Date = Date
global.Function = Function
global.Math = Math
global.Number = Number
global.Object = Object
global.RegExp = RegExp
global.String = String
global.Uint8Array = Uint8Array
global.WeakMap = WeakMap
global.Set = Set
global.Error = Error
global.TypeError = TypeError
global.parseInt = parseInt
global.parseFloat = parseFloat

beforeAll(async () => {
  const mongoUri = await mongoServer.getConnectionString()
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, err => {
    if (err) console.error(err)
  })
})

afterAll(() => {
  mongoose.disconnect()
  mongoServer.stop()
})

afterEach(async () => {
  console.log(process.env.CHALLONGE_TEST_URL)
  const { collections } = mongoose.connection
  const promises = []
  Object.keys(collections).forEach((collection) => {
    promises.push(collections[collection].deleteMany({}))
  })
  await Promise.all(promises)
})
