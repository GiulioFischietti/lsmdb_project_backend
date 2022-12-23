const { Entity } = require('./entity');

class Organizer extends Entity {
    constructor(data) {
        if (data == null) return null
        super(data)
    }
}

module.exports = {
    Organizer
}