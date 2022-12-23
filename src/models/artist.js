const { ObjectId } = require('mongodb');
const { mongoClient } = require('../config/mongoDB');
const { Entity } = require('./entity');

class Artist extends Entity {
    constructor(data) {
        if (data == null) return null
        super(data)
    }
}

module.exports = {
    Artist
}