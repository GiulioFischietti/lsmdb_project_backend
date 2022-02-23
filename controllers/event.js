
const express = require('express')

const nearEvents = (async (req, res) => {
    try {
        const options = {
            location: {
                $geoWithin: {
                    $centerSphere: [[parseFloat(req.body.latitude), parseFloat(req.body.longitude)], req.body.max_distance]
                }
            }
        }
        const near_events = await Event.find().where('location').near({ center: [parseFloat(req.body.latitude), parseFloat(req.body.longitude)] }).limit(16)
        res.send({ "success": true, "data": near_events })
    } catch (error) {
        console.log(error)
        res.send.status(500).send({ "error": error })
    }
})

module.exports = {
    nearEvents
}