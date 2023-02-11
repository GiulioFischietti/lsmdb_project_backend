const { ObjectId } = require('mongodb');
const { MongoCollection } = require('../config/mongoCollection');

class EntityMinimal {
    static mongoCollection = new MongoCollection({ collection: "entities" })
    constructor(data) {
        // console.log("ENTITY MINIMAL CONSTRUCTOR DATA:")
        // console.log(data)
        
        if (data == null) return null
        this._id = data._id != null ? ObjectId(data._id) : null;
        
        this.name = data.name;

        if (data.type != null)
            this.type = data.type;
        else data.type = "null"

        if (data.image != null)
            this.image = data.image;
        else data.image = "null"

        if (data.avgRate != null)
            this.avgRate = data.avgRate;
       

        if (data.score != null)
            this.score = data.score;
        
        if(data.avgRate == null) delete this.avgRate;
        if(data.score == null) delete this.score;

    }

    static entityByFacebookMinimal = async (facebookLink) => {
        const response = await this.mongoCollection.findOne({
            "facebookLinks": facebookLink
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