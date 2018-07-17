const Handler = require('./handler')

class Bot {
    constructor(bundle) {
        this.bundle = bundle
        this.handler = new Handler(bundle)

        bundle.db.getChat(chat => {
            this.bundle.chat = chat
            console.log('The chat is - ' + JSON.stringify(chat))
            this.handleUpdates()
        })

    }

    handleUpdates() {
        let { handler } = this
        let { tg, event, db, config } = this.bundle

        console.log('handling updates')

        tg.command('start', ctx => {
            let tgUser = ctx.message.from

            console.log('start command for user: ', JSON.stringify(tgUser))

            db.getUser(tgUser.id, user => {
                !user && db.createUser(tgUser, user => {
                    handler.start(user)
                })
            })
        })

        tg.command('getadminrights', ctx => {
            let tgUser = ctx.message.from
            let pass = ctx.message.text.split(' ')[1]

            console.log('getadminrights command for user: ', JSON.stringify(tgUser))

            event.removeAllListeners(tgUser.id)

            db.getUser(tgUser.id, user => {
                user && handler.getAdmin(user, pass)
            })
        })

        tg.on('message', ctx => {
            let tgUser = ctx.message.from

            console.log('message from user: ', JSON.stringify(ctx.message))

            event.emit(tgUser.id, ctx.message)
        })

        tg.on('callback_query', (ctx) => {
            console.log('callback_query data - ', JSON.stringify(ctx.callbackQuery.data))

            ctx.answerCbQuery()

            //emitter.emit(`getApprove:${ctx.callbackQuery.data.split("${}")[0]}${ctx.from.id}`, ctx.callbackQuery.data.split("${}")[1])
            /* emitter.emit(`getApprove:${ctx.callbackQuery.data.split("${}")[0]}${ctx.from.id}`, ctx.callbackQuery.data.split("${}")[1])
            emitter.emit(`getApprove:${ctx.callbackQuery.data.split("${}")[0]}${ctx.from.id}`, ctx.callbackQuery.data.split("${}")[1]) */
        })

        event.on('getApprove', user => {
            console.log('getApprove for user', JSON.stringify(user))

            db.getUsers({ status: 'admin' }, admins => {
                admins.forEach(admin => {
                    handler.getApprove(admin, user)
                })
            })
        })

        event.on('initMessaging', user => {
            handler.initMessaging(user)
        })
    }
}

module.exports = Bot;