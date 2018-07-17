const Handler = require('./handler')

class Bot {
    constructor(bundle) {
        this.bundle = bundle
        this.handler = new Handler(bundle)

        bundle.db.getChat(chat => {
            this.bundle.chat = chat
            console.log('The chat is - ' + JSON.stringify(chat))
        })

        this.handleUpdates()

    }

    handleUpdates() {
        let { handler } = this
        let { tg, event, db, config, chat } = this.bundle

        console.log('handling updates')
        console.log('TG instanse', JSON.stringify(tg))
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
            console.log('entered pass is - ' + pass)
            console.log('pass is - ' + config.ADMIN_PASS)

            event.removeAllListeners(tgUser.id)

            db.getUser(tgUser.id, user => {
                user && handler.getAdmin(user, pass)
            })
        })

        tg.on('message', ctx => {
            let tgUser = ctx.message.from

            console.log('message from user: ', JSON.stringify(ctx.message))

            !event.emit(tgUser.id, ctx.message) && event.emit('messaging', tgUser, ctx.message)
        })

        tg.on('callback_query', (ctx) => {
            let callback_query = JSON.parse(ctx.callbackQuery.data)
            console.log('callback_query data - ', JSON.stringify(callback_query))

            ctx.answerCbQuery()

            //emitter.emit(`getApprove:${ctx.callbackQuery.data.split("${}")[0]}${ctx.from.id}`, ctx.callbackQuery.data.split("${}")[1])
            event.emit(`getApprove:${callback_query.id}`, callback_query)
            event.emit(`initMessaging:${callback_query.id}`, callback_query)
        })

        event.on('getApprove', user => {
            console.log('getApprove for user', JSON.stringify(user))

            db.getUsers({ status: 'admin' }, admins => {
                admins && admins.forEach(admin => {
                    handler.getApprove(admin, user)
                })
            })
        })

        event.on('initMessaging', user => {
            console.log('initMessaging for user', JSON.stringify(user))
            handler.initMessaging(user)
        })

        event.on('messaging', (user, message) => {
            console.log('messaging for user', JSON.stringify(user))
            console.log('message', JSON.stringify(message))

            db.getUser(user.id, user => {
                if (user && (user.status == 'approved' || user.status == 'admin')) {
                    chat.history.push({
                        chatUsername: user.chatUsername,
                        message: {
                            type: 'text',
                            data: Date.now()
                        },
                        timestamp: Date.now(message.text)
                    })

                    chat.save(() => {})

                    db.getUsers({ $or: [{ status: 'approved' }, { status: 'admin' }] }, users => {
                        console.log('users for message', JSON.stringify(users))
                        users && users.forEach(receiver => {
                            receiver.id != user.id && tg.telegram.sendMessage(receiver.id, `${user.chatUsername}: (${new Date(Date.now()).toLocaleString()}) ${message.text}`)
                        })
                    })
                }
            })
        })
    }
}

module.exports = Bot;