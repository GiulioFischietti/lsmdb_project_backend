const { Artist } = require("./artist");
const { Club } = require("./club");
const { Organizer } = require("./organizer");

const buildEntity = (data) => {
    // if (data.type == null) return null;
    switch (data.type) {
        case "artist":
            return new Artist(data)
        case "club":
            return new Club(data)
        case "organizer":
            return new Organizer(data)
        default:
            return new Organizer(data)
    }
}

module.exports = {
    buildEntity
}