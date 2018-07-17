const config = require('../config.json')
const Controller = require('./controller')

class Client {
    constructor() {
        let db = new Controller(config.MONGO_URL)

        this.User = db.User
    }

    getUser(id, cb) {
        this.User.findOne({ id }, (err, user) => {
            cb(err ? undefined : (!user && Object.keys(user).length == 0 ? undefined : user))
        })
    }

    createUser(tgUser, cb) {
        
    }
}

module.exports = Client;

