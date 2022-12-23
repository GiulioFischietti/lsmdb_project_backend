const { User } = require('../models/user');
const bcrypt = require('bcrypt');

const signUp = async (req, res) => {
    try {
        const user = await User.getUserByUsername(req)
        if (user._id == null) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const newUser = await User.createUser(req, hashedPassword)
            res.status(200).send({ success: true, data: newUser });
        }
        else {
            res.status(200).send({ success: false, data: "Username already registered" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({ success: false, data: error })
    }
}

const logIn = async (req, res) => {
    const user = await User.getUserByUsername(req)
    console.log(user)
    if (user._id != null) {
        try {
            if (await bcrypt.compare(req.body.password, user.password))
                res.send({ "success": true, data: user })
            else res.status(403).send({ "success": false, data: "Wrong username/password" })
        } catch (error) {
            console.log(error)
            res.status(500).send()
        }
    }
    else {
        res.status(403).send({ success: false, data: "User not registered" });
    }
}
module.exports = {
    signUp,
    logIn
}