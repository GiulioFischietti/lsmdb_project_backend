const { Organizer } = require('../models/organizer');

const organizerById = async (req, res) => {
    try {
        var organizer = await Organizer.organizerById(req)
        res.status(200).send({ "success": true, "data": organizer })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

const organizerByFacebook = async (req, res) => {
    try {
        var organizer = await Organizer.organizerByFacebook(req)
        res.status(200).send({ "success": true, "data": organizer })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}

module.exports = {
    organizerById,
    organizerByFacebook
}