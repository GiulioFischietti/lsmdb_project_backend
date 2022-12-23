const { mongoClient } = require('./mongoDB');

class MongoCollection {
    constructor(data) {
        return mongoClient.collection(data.collection)
    }

}

module.exports = {
    MongoCollection
}