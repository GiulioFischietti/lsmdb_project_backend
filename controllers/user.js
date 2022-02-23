
const express = require('express')
const bcrypt = require('bcrypt')
var { MongoClient } = require('mongodb');

const getusers = (async (req, res) => {
    try {
        const users = await MongoClient.users.find({});
        console.log(users)
        res.json(users)
    } catch (error) {
        console.log(error)
        res.send.status(500).send({ "error": error })
    }
})

const signup = (async (req, res) => {
    try {
        var count = await userCollection.find({ email: req.body.email }).count();

        if (count == 0) {
            console.log(req.body)

            const hashedPassword = await bcrypt.hash(req.body.password, 10)

            res.status(200).send({ success: true, data: newUser });
        }
        else {
            res.status(200).send({ success: false, data: "Email already registered" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({ success: false, data: error })
    }
})

const login = (async (req, res) => {
    const user = await userCollection.findOne({ email: req.body.email })
    if (user != null) {
        try {
            if (await bcrypt.compare(req.body.password, user.password))
                res.send({ "success": true, data: user })
            else res.send({ "success": false, data: "Wrong email/password" })
        } catch {
            res.status(500).send()
        }
    }
    else {
        res.status(403).send({ success: false, data: "User not registered" });
    }
})

module.exports = {
    login,
    signup,
    getusers
}