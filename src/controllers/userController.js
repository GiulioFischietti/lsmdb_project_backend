const { User } = require('../models/user');

const userById = async (req, res) => {
    try {
        const user = await User.userById(req)
        res.status(200).send({ "success": true, "data": user })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const updateUser = async (req, res) => {
    const params = { ...req.body };
    delete params._id;

    try {
        User.updateUser(req.body._id, params)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

module.exports = {
    userById,
    updateUser
}