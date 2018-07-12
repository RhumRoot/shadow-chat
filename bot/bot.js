const Flow = require('./flow.js')

class Bot {
    constructor(bundle) {
        this.bundle = bundle
        this.flow = new Flow(bundle)

        this.handleUpdates()
    }

    handleUpdates() {
        let { flow } = this
        let { tg, events, db } = this.bundle

        tg.command('start', ctx => {
            let tgUser = ctx.message.from

            db.getUser(tgUser.id, user => {
                !user && db.createUser(tgUser, user => {  
                    flow.onStart(user)
                })
            })
        })

        tg.on('message', ctx => {
            let { event, db } = this.bundle;
            let user = ctx.message.from;
            user.source = 'tg';
            user.userid = user.id;

            db.trackUser(user, () => {
                event.emit(user.userid, ctx.message);
            });
        })
    }
}

module.exports = Bot;