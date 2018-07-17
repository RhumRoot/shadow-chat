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
        let user =  new this.User()

        user.id = tgUser.id
        //user.isAdmin = false
        user.username = tgUser.username
        user.first_name = tgUser.first_name
        user.last_name = tgUser.last_name
        user.created = Date.now()
        user.lastSeen = Date.now()

        user.save((err, user) => {
            cd( err ? undefined : user )
        })
    }
}

module.exports = Client;

