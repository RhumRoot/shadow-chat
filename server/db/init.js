const mongoose = require('mongoose')

class Init {
    constructor(url) {
        mongoose.connect(url, { useMongoClient: true })
        const connection = mongoose.connection
        connection.on('error', console.error('MongoDB connection error'))
        connection.once('open', console.info('MongoDB is connected'))

        const userSchema = mongoose.Schema({
            id: String,
            
            isAdmin: Boolean,

            username: String,
            first_name: String,
            last_name: String,

            created: Number,
            lastSeen: Number
        })

        const User = mongoose.model('User', userSchema)

        this.User = User
    }
}

module.exports = Init