const { RegisteredUser } = require('../models/registeredUser');
const { User } = require('../models/user');
const { Entity } = require('../models/entity');
const bcrypt = require('bcrypt');
const { Manager } = require('../models/manager');

const signUp = async (req, res) => {
    try {
        const user = await User.getUserByUsername(req)
        if (user._id == null) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            req.body.password = hashedPassword
            const newUser = await User.createUser(req.body)
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

const signUpAsAManager = async (req, res) => {
    try {
        delete req.body._id
        const user = await Manager.getUserByUsername(req)
        if (user == null) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            req.body.password = hashedPassword
            var managedEntity = await Entity.entityByFacebook(req.body.facebookLink)
            req.body.managedEntities = [managedEntity]
            const manager = new Manager(req.body)
            Manager.createUser(manager)
            res.status(200).send({ success: true, data: manager });
        }
        else {
            res.status(200).send({ success: false, data: "Username already registered" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({ success: false, data: error })
    }
}
const usernameExists = async (req, res) => {
    try {
        const user = await RegisteredUser.getUserByUsername(req)
        console.log(user)
        if (user == null) {
            res.status(200).send({ success: true, data: false });
        }
        else {
            res.status(200).send({ success: false, data: true })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({ success: false, data: error })
    }
}
const logIn = async (req, res) => {
    const user = await RegisteredUser.getUserByUsername(req)
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
    signUpAsAManager,
    logIn,
    usernameExists
}