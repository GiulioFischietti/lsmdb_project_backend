const { ObjectId } = require("mongodb");

class UserMinimal {
    constructor(data){
        if(data==null) return null
        this._id = new ObjectId(data._id);
        this.username = data.username;
        this.image = data.image;
    }
}

module.exports = { UserMinimal }