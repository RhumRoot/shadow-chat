const config = require('../config.json')
const db = new (require('./controller'))(config.MONGO_URL)

class Client {
    constructor() {
        
    }

    getUser(id) {
        
    }
}

module.exports = Client;

