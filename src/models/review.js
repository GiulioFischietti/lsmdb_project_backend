const { MongoCollection } = require("../config/mongoCollection");

class Review {
    static mongoCollection = new MongoCollection({ collection: "reviews", attribute: "name" })

    constructor(data) {
        if (data == null) return null
        this._id = data._id;
        this.username = data.username;
        this.description = data.description;
        this.rate = data.rate;
        this.images = data.images;
        this.propic = data.propic;
        this.createdAt = data.createdAt;
        this.entity_id = data.entity_id;
    }

    static isDuplicate = async (review) => {
        const reviewToCheck = await this.mongoCollection.findOne({
            username: review.username,
            description: review.description,
            entity_id: review.entity_id
        })
        return reviewToCheck != null
    }

    static createReview = async (review) => {
        const reviewToAdd = new Review(review);
        this.mongoCollection.insert(reviewToAdd);
    }
    
    static uploadReviews = async (reviewsToAdd) => {
        const addedReviews = await this.mongoCollection.insertMany(reviewsToAdd)
    }
}

module.exports = { Review }