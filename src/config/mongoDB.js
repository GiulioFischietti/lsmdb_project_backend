var { MongoClient } = require('mongodb');

const mongoInstance = new MongoClient(process.env.DATABASE_URL, { dbName: "needfy" });
mongoInstance.connect().then(() => console.log("DB connected"));
const mongoClient = mongoInstance.db('needfy')

module.exports = {
    mongoClient
}