const { RegisteredUser } = require('../models/registeredUser');
const { User } = require('../models/user');
const { Entity } = require('../models/entity');
const bcrypt = require('bcrypt');
const { Manager } = require('../models/manager');

const signUp = async (req, res) => {
    var newUserMongoDB;
    var newUserNeo4j;

    try {
        const user = await User.getUserByUsername(req)
        if (user == null) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            req.body.password = hashedPassword
            newUserMongoDB = await User.createUserMongoDB(req.body)
            newUserNeo4j = await User.createUserNeo4j(newUserMongoDB);
            res.status(200).send({ success: true, data: newUserMongoDB });
        }
        else {
            res.status(200).send({ success: false, data: "Username already registered" })
        }
    } catch (error) {
        // console.log(error)
        console.log("EXCEPTION, ROLLBACK")
        if (newUserMongoDB != null) {
            console.log("ROLLBACK CREATION ON MONGO")
            await User.deleteUserMongoDB(newUserMongoDB._id)
        }
        if (newUserNeo4j != null) {
            console.log("ROLLBACK CREATION ON NEO4J")
            await User.deleteUser(newUserMongoDB._id)
        }
        res.status(500).send({ success: false })
    }
}

const uploadUserOnNeo4j = async (req, res) => {
    try {
        await User.createUserNeo4j(req.body.user)
        res.status(200).send({ success: true, data: null });
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
            req.body.managedEntity = managedEntity
            console.log(managedEntity);
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
    usernameExists,
    uploadUserOnNeo4j
}