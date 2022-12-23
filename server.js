const express = require('express')
require('dotenv').config()
const cors = require('cors');

const eventRouter = require('./src/routes/eventRoutes')
const minimalEntityRouter = require('./src/routes/minimalEntityRoutes')
const entityRouter = require('./src/routes/entityRoutes')
const authRouter = require('./src/routes/authRoutes')
const reviewRouter = require('./src/routes/reviewRoutes')
const uninterestingEventRouter = require('./src/routes/uninterestingEventRoutes')
// const analyticsRouter = require('./src/routes/analyticsRoutes')

const app = express();

app.use(cors())
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

app.listen(3000, () => console.log("Server started"))


app.use("/minimalEntity", minimalEntityRouter)
app.use("/event", eventRouter)
app.use("/uninterestingEvent", uninterestingEventRouter)
app.use("/entity", entityRouter)
app.use("/auth", authRouter)
app.use("/review", reviewRouter)
// app.use("/analytics", analyticsRouter)



