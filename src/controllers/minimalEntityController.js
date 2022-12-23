const { EntityMinimal } = require('../models/entityMinimal');

const minimalEntityByFacebook = async (req, res) => {
    try {
        var entityMinimal = await EntityMinimal.entityByFacebookMinimal(req.query.facebook)
        res.status(200).send({ "success": true, "data": entityMinimal })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}

module.exports = { minimalEntityByFacebook }