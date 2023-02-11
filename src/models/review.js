const { ObjectId } = require("mongodb");
const { MongoCollection } = require("../config/mongoCollection");
const { EntityMinimal } = require("./entityMinimal");
const { UserMinimal } = require("./UserMinimal");
const stopwords = require('stopwords-it'); // array of stopwords

class Review {
    static mongoCollection = new MongoCollection({ collection: "reviews" })
    // static entityCollection = new MongoCollection({ collection: "entities" })

    constructor(data) {
        if (data == null) return null
        this._id = ObjectId(data._id);
        this.description = data.description != null ? data.description : "";
        this.rate = data.rate;
        this.images = data.images != null ? data.images : [];
        this.createdAt = data.createdAt != null ? data.createdAt : new Date();
        this.updatedAt = data.updatedAt != null ? data.updatedAt : new Date();
        this.entity = new EntityMinimal(data.entity);
        this.user = new UserMinimal(data.user);
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
        var reviewToAdd = new Review(review);

        const response = await this.mongoCollection.insertOne(reviewToAdd);
        reviewToAdd._id = ObjectId(response.insertedId);
        var entityId = reviewToAdd.entity._id
        // reviewToAdd.entity = null
        delete reviewToAdd.entity

        return [reviewToAdd, entityId]

    }

    static editReview = async (reviewId, review) => {
        var reviewEdited = new Review(review);
        // console.log(reviewId)
        this.mongoCollection.updateOne({ _id: ObjectId(reviewId) }, { $set: { description: reviewEdited.description, rate: reviewEdited.rate } });
        var entityId = reviewEdited.entity._id
        // reviewEdited.entity = null
        delete reviewEdited.entity
        return [reviewEdited, entityId]
    }

    static deleteReview = async (reviewId) => {
        this.mongoCollection.deleteOne({ _id: ObjectId(reviewId) })
    }

    static deleteReviewsOfUser = async (userId) => {
        this.mongoCollection.updateMany({ "user._id": ObjectId(userId) }, {$set: {username: "DeletedUser", image: "deleted user.png"}})
    }

    static getReviewsById = async (reviewIds) => {
        reviewIds = reviewIds.map((item) => ObjectId(item))
        const response = await this.mongoCollection.find({ _id: { $in: reviewIds } }).sort({ createdAt: -1 }).toArray()
        return response.map((item) => { return new Review(item) });
    }

    static getAvgEntity = async (_id) => {
        // console.log(_id)
        const response = await this.mongoCollection.aggregate([
            { $match: { "entity._id": _id } },
            { $group: { _id: "$entity._id", avgRate: { $avg: "$rate" } } }
        ]).toArray()
        // console.log(response[0])
        return response[0] != null ? response[0].avgRate : 0
    }

    static uploadReviews = async (reviewsToAdd) => {
        const addedReviews = await this.mongoCollection.insertMany(reviewsToAdd)
    }

    static updateEmbeddedEntity = async (_id, entity) => {
        this.mongoCollection.updateMany({ "entity._id": ObjectId(_id) }, { $set: { "entity.name": entity.name, "entity.image": entity.image } })
    }

    static updateEmbeddedUser = async (_id, user) => {
        return await this.mongoCollection.updateMany({ "user._id": ObjectId(_id) }, { $set: { "user.username": user.username, "user.image": user.image } })
    }


    static entityRateByYear = async (entityId) => {
        return await this.mongoCollection.aggregate([
            {
                $match: {
                    "entity._id": ObjectId(entityId),

                },
            },
            {
                $group: {
                    _id: {
                        year: {
                            $year: "$createdAt",
                        },
                    },
                    count: {
                        $sum: 1
                    },
                    avg: {
                        $avg: "$rate",
                    },
                },
            },
            {
                $match: {
                    "_id.year": { $ne: null },

                },
            },
            {
                $sort: {
                    "_id.year": 1,
                },
            }
        ]).toArray()

    }

    static mostUsedWordsForClub = async (entityId) => {
        return this.mongoCollection.aggregate([
            {
                $match: {
                    "entity._id": ObjectId(entityId),
                    description: {
                        $ne: "",
                    },
                },
            },
            {
                $project: {
                    description: "$description",
                },
            },
            {
                $group: {
                    _id: null,
                    descriptionsArray: {
                        $push: {
                            $concat: ["$description"],
                        },
                    },
                },
            },
            {
                $project: {
                    concatDescription: {
                        $toLower: {
                            $reduce: {
                                input: "$descriptionsArray",
                                initialValue: "",
                                in: {
                                    $concat: ["$$value", " ", "$$this"],
                                },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    words: {
                        $split: ["$concatDescription", " "],
                    },
                },
            },
            {
                $project: {
                    filteredWords: {
                        $filter: {
                            input: "$words",
                            as: "word",
                            cond: {
                                $not: {
                                    $in: [
                                        "$$word",
                                        stopwords.concat(['', "'", ".", ":", "l'", ",", ":", ";", "?", "!"]),
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            {
                $unwind: {
                    path: "$filteredWords",
                },
            },
            {
                $group: {
                    _id: "$filteredWords",
                    count: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: {
                    count: -1,
                },
            },
            {
                $limit: 10
            }
        ]
        ).toArray()


    }

    static getCriticUsers = (fromDate) => {
        return this.mongoCollection.aggregate([
            { $match: { createdAt: { $gte: new Date(fromDate) } } },
            {
                $project: { user: 1, rate: 1 }
            },
            {
                $group: {
                    _id: "$user",
                    nReviews: {
                        $count: {},
                    },
                    avg: {
                        $avg: "$rate",
                    },
                },
            },
            {
                $addFields: {
                    criticScore: {
                        $multiply: [
                            { $subtract: ["$avg", 3] },
                            {
                                $sum: [
                                    {
                                        $log10: "$nReviews",
                                    },
                                    1,
                                ],
                            }
                        ]
                    }
                },
            },
            {
                $sort: {
                    criticScore: 1,
                },
            },
            { $limit: 10 }
        ], { allowDiskUse: true }
        ).toArray()
    }

}

module.exports = { Review }