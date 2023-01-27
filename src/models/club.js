const { ObjectId } = require('mongodb');
const { Entity } = require('./entity');

class Club extends Entity {
    constructor(data) {
        if (data == null) return null
        super(data);
        // this.assignedTo = data.assignedTo;
        this.location = data.location;
        this.address = data.address;
        this.lastUpdatedEvent = data.lastUpdatedEvent;
    }
}

module.exports = {
    Club
}