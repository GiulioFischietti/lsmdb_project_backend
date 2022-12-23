const { ObjectId } = require('mongodb');
const { MongoCollection } = require('../config/mongoCollection');

class EntityMinimal {
    static mongoCollection = new MongoCollection({ collection: "entities" })
    constructor(data) {
        if (data == null) return null
        this._id = ObjectId(data._id);
        this.name = data.name;

        if (data.type != null)
            this.type = data.type;
        else data.type = "null"

        if (data.image != null)
            this.image = data.image;
        else data.image = "null"
    }

    static entityByFacebookMinimal = async (facebookLink) => {
        const response = await this.mongoCollection.findOne({
            "facebook": facebookLink
        },
            {
                projection: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    type: 1
                }
            }
        )
        return new EntityMinimal(response)
    }
}

module.exports = {
    EntityMinimal
}