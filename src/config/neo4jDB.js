const neo4jDriver = require('neo4j-driver')
const {
    GRAPHDB_URL,
    GRAPHDB_USERNAME,
    db_password,
} = process.env
var driver = neo4jDriver.driver(
    GRAPHDB_URL,
    neo4jDriver.auth.basic(GRAPHDB_USERNAME, db_password)
)

const neo4jClient = driver.session();

module.exports = {
    neo4jClient
}