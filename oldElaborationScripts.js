
app.post('/updateeventorganizers', async (req, res) => {
    try {
        var organizers_retrieved = []
        var missing_organizers = 0
        for (let i = 0; i < req.body.event.organizers.length; i++) {

            var organizer = await client.db('needfy').collection('collapsed_organizers').findOne({ facebook: req.body.event.organizers[i] })
            if (organizer != null) {
                organizers_retrieved.push(organizer)
            } else {
                missing_organizers++
                organizers_retrieved.push(req.body.event.organizers[i])
            }
        }
        console.log(missing_organizers + ' missing organizers\n')
        client.db('needfy').collection('events').updateOne({ _id: ObjectId(req.body.event._id) }, { $set: { organizers_updated: true, organizers: organizers_retrieved } })
        res.status(200).send({ "success": true, "data": null })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/getorganizerstosynctype', async (req, res) => {
    try {
        const organizers_notype = await client.db('needfy').collection('collapsed_organizers').find({ updatedType: { $exists: false } }).toArray()

        res.status(200).send({ "success": true, "data": organizers_notype })
    } catch (e) {
        console.log(e)
        res.status(500).send({ "error": error })
    }
})

app.get('/getorganizerstosyncfacebook', async (req, res) => {
    try {
        const organizers_wrong_link = await client.db('needfy').collection('collapsed_organizers').find({ facebook: { $regex: "-" } }).sort({ _id: 1 }).toArray()

        res.status(200).send({ "success": true, "data": organizers_wrong_link })
    } catch (e) {
        console.log(e)
        res.status(500).send({ "error": error })
    }
})

app.get('/sync_all_organizers_of_events', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")

        for (let i = 0; i < searched_events.length; i++) {

            if ((counter % 1000) == 0) { console.log(counter / 1000) }
            var new_organizers = []
            for (let j = 0; j < searched_events[i].organizers.length; j++) {
                if (searched_events[i].organizers[j] != null) {
                    var other_organizer = await client.db('needfy').collection("collapsed_organizers").findOne(
                        {
                            _id: ObjectId(searched_events[i].organizers[j]._id)
                        },
                        {
                            projection: {
                                _id: 1,
                                name: 1,
                                image: 1,
                                type: 1
                            }
                        })
                    if (other_organizer != null) {
                        // if ((counter % 1000) == 0) { console.log(other_organizer) }

                        new_organizers.push(other_organizer)
                    }
                }
            }

            counter++
            client.db('needfy').collection("events").updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { organizers: new_organizers } })

        }
        res.status(200).send({ "success": true, "data": null })
    } catch (e) {
        console.log(e)
    }
})

app.get('/sync_all_clubs_of_events', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")

        for (let i = 0; i < searched_events.length; i++) {

            if ((counter % 1000) == 0) { console.log(counter / 1000) }
            var club

            if (searched_events[i].club != null) {
                var retrievedClub = await client.db('needfy').collection("collapsed_organizers").findOne(
                    {
                        _id: ObjectId(searched_events[i].club._id)
                    },
                    {
                        projection: {
                            _id: 1,
                            name: 1,
                            image: 1,
                            type: 1
                        }
                    })
                if (retrievedClub != null) {
                    // if ((counter % 1000) == 0) { console.log(other_organizer) }
                    club = retrievedClub
                    client.db('needfy').collection("events").updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { "club": club } })
                }
            }

            counter++

        }
        res.status(200).send({ "success": true, "data": null })
    } catch (e) {
        console.log(e)
    }
})

app.get('/sync_all_artists_of_events', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")

        for (let i = 0; i < searched_events.length; i++) {

            if ((counter % 1000) == 0) { console.log(counter / 1000) }
            var new_artists = []
            for (let j = 0; j < searched_events[i].artists.length; j++) {
                if (searched_events[i].artists[j] != null) {
                    var other_artist = await client.db('needfy').collection("collapsed_organizers").findOne(
                        {
                            _id: ObjectId(searched_events[i].artists[j]._id)
                        },
                        {
                            projection: {
                                _id: 1,
                                name: 1,
                                image: 1,
                                type: 1
                            }
                        })
                    if (other_artist != null) {
                        // if ((counter % 1000) == 0) { console.log(other_organizer) }

                        new_artists.push(other_artist)
                    }
                }
            }

            counter++
            client.db('needfy').collection("events").updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { artists: new_artists } })

        }
        res.status(200).send({ "success": true, "data": null })
    } catch (e) {
        console.log(e)
    }
})
app.get('/count_missing_organizers', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")

        var missing_counter = 0
        for (let i = 0; i < searched_events.length; i++) {

            if ((counter % 1000) == 0) { console.log(counter / 75000) }



            for (let j = 0; j < searched_events[i].organizers.length; j++) {
                var other_organizer = await client.db('needfy').collection("collapsed_organizers").findOne({ _id: ObjectId(searched_events[i].organizers[j]._id), facebook: searched_events[i].organizers[j].facebook })
                if (other_organizer == null) { missing_counter++ }
            }
            counter++
        }
        res.status(200).send({ "success": true, "data": missing_counter })
    } catch (e) {
        console.log(e)
    }
})
app.get('/sync_oldevents_organizers', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({ createdAt: { $lte: (new Date("2022-04-25")) } }).toArray()
        console.log("done.\n")


        for (let i = 0; i < searched_events.length; i++) {
            var organizers_retrieved = [];
            if ((counter % 1000) == 0) { console.log(counter / 75000) }

            if (searched_events[i].club != null) {
                organizers_retrieved.push(searched_events[i].club)
            }
            if (searched_events[i].organizer != null) {
                var organizer = await client.db('needfy').collection(searched_events[i].organizer.type + 's').findOne({ id: searched_events[i].organizer.id })
                if (organizer != null) { organizers_retrieved.push(organizer) }
                // await club.db('needfy').collection('events').updateOne({_id: ObjectId(searched_events[i]._id)}, )
            }
            if (searched_events[i].other_organizers != null) {
                for (let j = 0; j < searched_events[i].other_organizers.length; j++) {
                    var other_organizer = await client.db('needfy').collection(searched_events[i].other_organizers[j].type + 's').findOne({ id: searched_events[i].other_organizers[j].id })
                    if (other_organizer != null) { organizers_retrieved.push(other_organizer) }
                }
            }

            var clean = []

            for (let z = 0; z < organizers_retrieved.length; z++) {
                var must_add = true
                for (let p = 0; p < clean.length; p++) {
                    if (organizers_retrieved[z].facebook == clean[p].facebook) {
                        must_add = false
                        break
                    }
                }
                if (must_add) { clean.push(organizers_retrieved[z]) }

            }

            for (let k = 0; k < organizers_retrieved.length; k++) {
                if (organizers_retrieved[k] == null) {
                    console.log(searched_events[i])
                }

            }

            await client.db('needfy').collection('events').updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { organizers: clean } })
            counter++
        }
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})



app.get('/update_events_organizers_artists', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")


        for (let i = 0; i < searched_events.length; i++) {
            var organizers_retrieved = [];
            var artists_retrieved = [];
            if ((counter % 1000) == 0) { console.log(counter / 1000) }


            for (let j = 0; j < searched_events[i].organizers.length; j++) {

                if (searched_events[i].organizers[j].type != "artist") {
                    organizers_retrieved.push(searched_events[i].organizers[j])
                } else {
                    artists_retrieved.push(searched_events[i].organizers[j])
                }
            }

            for (let j = 0; j < searched_events[i].artists.length; j++) {
                if (searched_events[i].artists[j].type != "artist") {
                    organizers_retrieved.push(searched_events[i].artists[j])
                } else {
                    artists_retrieved.push(searched_events[i].artists[j])
                }
            }

            await client.db('needfy').collection('events').updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { "organizers": organizers_retrieved, "artists": artists_retrieved } })
            counter++
        }
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/sync_newevents_organizers', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting organizers...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")


        for (let i = 0; i < searched_events.length; i++) {
            var organizers_retrieved = [];
            if ((counter % 1000) == 0) { console.log(counter / 920) }

            if (searched_events[i].organizers != null) {
                for (let j = 0; j < searched_events[i].organizers.length; j++) {
                    var organizer = await client.db('needfy').collection("collapsed_organizers").findOne({ _id: ObjectId(searched_events[i].organizers[j]._id) })
                    if (organizer != null) { organizers_retrieved.push(organizer) } else { console.log("organier not found") }
                }
            }

            var clean = []

            for (let z = 0; z < organizers_retrieved.length; z++) {
                var must_add = true
                for (let p = 0; p < clean.length; p++) {
                    if (organizers_retrieved[z].facebook == clean[p].facebook) {
                        must_add = false
                        break
                    }
                }
                if (must_add) { clean.push(organizers_retrieved[z]) }

            }

            var must_add_club = true
            if (searched_events[i].club != null) {
                for (let p = 0; p < clean.length; p++) {
                    if (clean[p].facebook == searched_events[i].club.facebook) {
                        must_add_club = false
                        break
                    }
                }
                if (must_add_club) { clean.push(searched_events[i].club) }
            }



            for (let k = 0; k < organizers_retrieved.length; k++) {
                if (organizers_retrieved[k] == null) {
                    console.log(searched_events[i])
                }

            }

            await client.db('needfy').collection('events').updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { "organizers": clean } })
            counter++
        }
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/create_artists_field', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")


        for (let i = 0; i < searched_events.length; i++) {
            var artists = []
            if ((counter % 1000) == 0) { console.log(counter / 75000) }

            if (searched_events[i].organizers != undefined) {
                for (let j = 0; j < searched_events[i].organizers.length; j++) {
                    if (searched_events[i].organizers[j].type == "artist") {
                        artists.push(searched_events[i].organizers[j])
                    }
                }
            } else {
                searched_events[i]
            }

            await client.db('needfy').collection('events').updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { "artists": artists } })
            counter++
        }
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/remove_artists_from_organizers', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")


        for (let i = 0; i < searched_events.length; i++) {
            var organizers_filtered = []
            if ((counter % 1000) == 0) { console.log(counter / 920) }

            if (searched_events[i].organizers != undefined) {
                for (let j = 0; j < searched_events[i].organizers.length; j++) {
                    if (searched_events[i].organizers[j].type != "artist") {
                        organizers_filtered.push(searched_events[i].organizers[j])
                    }
                }
            } else {
                searched_events[i]
            }

            await client.db('needfy').collection('events').updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { "organizers": organizers_filtered } })
            counter++

        }
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})


app.post('/updateeventimagename', async (req, res) => {
    try {

        const event = await client.db('needfy').collection('events').updateOne({ _id: ObjectId(req.body._id) }, { $set: { image: req.body.image } })

        res.status(200).send({ "success": true, "data": event })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.post('/updateorganizername', async (req, res) => {
    const club = await client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(req.body._id) }, { $set: { name: req.body.name } })
    res.status(200).send({ "success": true, "data": club })
})

app.post('/updateentitymaps', async (req, res) => {
    const club = await client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(req.body._id) },
        {
            $set:
                { maps_link: req.body.maps_link }
        })
    res.status(200).send({ "success": true, "data": club })
})

app.post('/updateclubtype', async (req, res) => {
    const club = await client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(req.body._id) }, { $set: { typeUpdated: true, facebookDescription: req.body.facebook_description, type: req.body.type } })
    res.status(200).send({ "success": true, "data": club })
})


app.post('/updateclubfacebook', async (req, res) => {
    const club = await client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(req.body._id) }, { $set: { facebook: req.body.facebook } })
    res.status(200).send({ "success": true, "data": club })
})

app.post('/updateeventimage', async (req, res) => {
    const club = await client.db('needfy').collection('events').updateOne({ _id: ObjectId(req.body._id) }, { $set: { imageUpdated: true } })
    res.status(200).send({ "success": true, "data": null })
})


app.get('/recoverartistsname', async (req, res) => {
    // 
    const artists = await client.db('needfy').collection('collapsed_organizers').find({
        type: "artist",
        name: null
    }).toArray();

    for (let i = 0; i < artists.length; i++) {
        var events = [];
        events = await client.db('needfy').collection('events').findOne({ "artists.facebook": artists[i].facebook })
        if (events != null) {
            console.log(events)
            for (let j = 0; j < events.artists.length; j++) {
                if (events.artists[j].facebook == artists[i].facebook) {
                    client.db('needfy').collection('collapsed_organizers').updateOne({ facebook: artists[i].facebook }, { $set: { name: events.artists[j].name } })
                    break
                }
            }
        }
    }


    res.status(200).send({ "success": true, "data": artists })
})

app.post('/setorganizerasscraped', async (req, res) => {

    client.db('needfy').collection('entities_to_scrape').updateOne({ facebook: req.body.facebook }, { $set: { scraped: true } })
    res.status(200).send({ "success": true, "data": null })
})

app.get('/standardizeclubs', async (req, res) => {
    try {

        var clubstofix = await client.db('needfy').collection('collapsed_organizers').find({ facebook: { $regex: "/pg/" } }).toArray()
        for (let i = 0; i < clubstofix.length; i++) {
            var new_link = clubstofix[i].facebook.replace("/pg/", "/")
            const organizer = await client.db('needfy').collection('collapsed_organizers').findOne({ facebook: new_link })
            if (organizer != null) {
                client.db('needfy').collection('collapsed_organizers').deleteOne({ _id: ObjectId(organizer._id) })
            } else {
                client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(clubstofix[i]._id) }, { $set: { facebook: new_link } })
            }

        }
        res.status(200).send({ "success": true, "data": "fixed " + clubstofix.length + " clubs." })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})
app.get('/standardizeclubsfacebook', async (req, res) => {
    try {

        var removed = 0
        var updated = 0
        var clubstofix = await client.db('needfy').collection('collapsed_organizers').find().toArray()
        for (let i = 0; i < clubstofix.length; i++) {
            var new_link = clubstofix[i].facebook.toLowerCase()
            if (new_link != clubstofix[i].facebook) {
                const organizer = await client.db('needfy').collection('collapsed_organizers').findOne({ facebook: new_link })
                if (organizer != null) {
                    client.db('needfy').collection('collapsed_organizers').deleteOne({ _id: ObjectId(clubstofix[i]._id) })
                    removed++
                } else {
                    client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(clubstofix[i]._id) }, { $set: { facebook: new_link } })
                    updated++
                }
            }

        }
        res.status(200).send({ "success": true, "data": "Deleted " + removed + " clubs. Updated " + updated + ' clubs.' })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/mergeorganizers', async (req, res) => {
    try {

        var clubs = await client.db('needfy').collection('clubs').find().toArray()

        for (let i = 0; i < clubs.length; i++) {
            delete clubs[i]._id
            client.db('needfy').collection('collapsed_organizers').insertOne(clubs[i])

        }

        var artists = await client.db('needfy').collection('artists').find().toArray()

        for (let i = 0; i < artists.length; i++) {
            delete artists[i]._id
            client.db('needfy').collection('collapsed_organizers').insertOne(artists[i])

        }

        var organizers = await client.db('needfy').collection('organizers').find().toArray()

        for (let i = 0; i < organizers.length; i++) {
            delete organizers[i]._id
            client.db('needfy').collection('collapsed_organizers').insertOne(organizers[i])

        }


        res.status(200).send({ "success": true, "data": null })


    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})


app.get('/getreviewedclubs', async (req, res) => {

    var groupedevents = await client.db('needfy').collection('reviews').aggregate([{ "$group": { "_id": "$entity_id", "count": { "$sum": 1 } } }, { "$match": { "_id": { "$ne": null }, "count": { "$gte": 10 } } }], { allowDiskUse: true }).toArray()

    var clubs = await client.db('needfy').collection('collapsed_organizers').find({ retrieved_reviews: { $exists: false }, _id: { $in: groupedevents.map((element) => { return ObjectId(element._id) }) } }).toArray()

    res.status(200).send({ "success": true, "data": clubs })

})

app.get('/getduplicatesclubs', async (req, res) => {

    var groupedclubs = await client.db('needfy').collection('collapsed_organizers').aggregate([{ "$group": { "_id": { "facebook": "$facebook" }, "count": { "$sum": 1 }, clubs: { $push: "$$ROOT" } } }, { "$match": { "_id": { "$ne": null }, "count": { "$gt": 1 } } }, { "$sort": { "count": -1 } }], { allowDiskUse: true }).toArray()

    res.status(200).send({ "success": true, "data": groupedclubs })

})

app.get('/removeduplicatedclubs', async (req, res) => {

    var groupedclubs = await client.db('needfy').collection('collapsed_organizers').aggregate([{ "$group": { "_id": { "facebook": "$facebook" }, "count": { "$sum": 1 }, clubs: { $push: "$$ROOT" } } }, { "$match": { "_id": { "$ne": null }, "count": { "$gt": 1 } } }, { "$sort": { "count": -1 } }], { allowDiskUse: true }).toArray()
    for (let i = 0; i < groupedclubs.length; i++) {
        var i_max = 0
        for (let j = 0; j < groupedclubs[i].clubs.length; j++) {
            nfields = Object.keys(groupedclubs[i].clubs[j]).length
            if (nfields >= i_max) {
                i_max = j
            }
        }

        for (let j = 0; j < groupedclubs[i].clubs.length; j++) {
            if (j != i_max) {
                client.db('needfy').collection('collapsed_organizers').deleteOne({ _id: groupedclubs[i].clubs[j]._id })
            }
        }


    }
    res.status(200).send({ "success": true, "data": groupedclubs })

})

app.get('/nclubstobescraped', async (req, res) => {
    // 
    const clubs = await client.db('needfy').collection('clubs').countDocuments({ lastUpdatedEvent: { "$lte": new Date(new Date() - 7 * 60 * 60 * 24 * 1000) } })
    res.status(200).send({ "success": true, "data": clubs })
})





app.get('/eventsbyworker', async (req, res) => {
    var machine_0_count = await client.db('needfy').collection('events').countDocuments({ addedByMachine: 0 });
    var machine_1_count = await client.db('needfy').collection('events').countDocuments({ addedByMachine: 1 });

    res.status(200).send({ "success": true, "data": { "machine_0_count": machine_0_count, "machine_1_count": machine_1_count } })
})

app.get('/eventsbydate', async (req, res) => {

    var keys = [];

    for (let i = 6; i >= 0; i--) {
        keys.push(new Date(new Date() - i * 60 * 60 * 24 * 1000).toISOString().split('T')[0])
    }
    var result = await client.db('needfy').collection('events').aggregate([
        {
            "$match":
            {
                addedByMachine: parseInt(req.query.machine),
                createdAt: {
                    $gte: new Date(new Date() - 6 * 60 * 60 * 24 * 1000)
                }
            }
        },
        {
            "$group": {
                _id: { "$dateToString": { date: { "$toDate": "$_id" }, format: '%Y-%m-%d' } },
                "count": { "$sum": 1 }

            }
        }
        ,
        { "$sort": { "_id": 1 } }

    ], { allowDiskUse: true }).toArray()

    for (let j = 0; j < keys.length; j++) {
        if (result[j] == null || result[j]._id != keys[j]) {
            result.splice(j, 0, { _id: keys[j], count: 0 });
        }
    }

    res.status(200).send({ "success": true, "data": result })
})


app.get('/organizerstoscrape', async (req, res) => {
    const clubs = await client.db('needfy').collection('entities_to_scrape').find({ scraped: { $exists: false } }).toArray();
    res.status(200).send({ "success": true, "data": clubs })
})


app.get('/getallartists', async (req, res) => {
    // 
    const artists = await client.db('needfy').collection('collapsed_organizers').find({
        type: "artist"
        // lastUpdatedEvent: { "$lte": new Date(new Date() - 7 * 60 * 60 * 24 * 1000) }, assignedTo: parseInt(req.query.machine)
    }).toArray();
    res.status(200).send({ "success": true, "data": artists })
})



app.get('/removeduplicatereviews', async (req, res) => {
    try {

        var entity_ids = (await client.db('needfy').collection('reviews').aggregate([{ $group: { _id: "$username" } }]).toArray())
        // .forEach(async (entity_id)=>{
        //     const org = await client.db('needfy').collection('collapsed_organizers').findOne({_id: ObjectId(entity_id._id)})
        //     if(org == null) {
        //         client.db('needfy').collection('reviews').deleteMany({"entity_id": ObjectId(entity_id._id)})
        //     }
        // })

        res.status(200).send({ "success": true, "data": entity_ids })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error, "data": null })
    }
})

