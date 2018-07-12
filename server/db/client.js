const config = require('../config.json')
const Controller = require('./controller')

class Client {
    constructor() {
        let db = new Controller(config.MONGO_URL)

        this.User = db.User
    }

    getUser(id, cb) {

    }

    createUser(tgUser, cb) {
        
    }
}

module.exports = Client;

