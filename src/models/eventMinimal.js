const { ObjectId } = require("mongodb");

class EventMinimal {
    constructor(data) {
        if (data == null) return null
        this._id = ObjectId(data._id);
        this.name = data.name;
        this.start = new Date(data.start);
        this.genres = data.genres;
        this.image = data.image;
        this.address = data.address;
    }
}

module.exports = {
    EventMinimal
}