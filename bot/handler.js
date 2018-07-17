const flowManager = require('flow-manager')

class Handler {
    constructor(bundle) {
        this.bundle = bundle;
    }

    start(user) {
        let { tg, event, db } = this.bundle

        flowManager
            .create()
            .addStep((flow, data) => {
                tg.telegram.sendMessage(data.user.id, 'Hi, thanks for joining. Please choose your username (it will precede your messages in the group chat)')

                flow.next(data)
            })
            .addStep((flow, data) => {
                event.once(data.user.id, msg => {
                    msg.text ? (
                        msg.text.length <= 20 ? (
                            data.user.chatUsername = msg.text,
                            flow.next(data)
                        ) : (
                                tg.telegram.sendMessage(data.user.id, 'Your username must be less than 20 characters. Enter it again'),
                                flow.repeat(data)
                            )
                    ) : (
                            tg.telegram.sendMessage(data.user.id, 'Please enter your username'),
                            flow.repeat(data)
                        )
                })
            })
            .addStep((flow, data) => {
                db.getUser({ chatUsername: data.user.chatUsername }, user => {
                    user ? (
                        tg.telegram.sendMessage(data.user.id, 'Sorry, that username is already taken. Try another please'),
                        flow.nextFrom(2)
                    ) : (
                            data.user.save((err, user) => {
                                err && console.error('~~~ Error while saving chatUsername:', err)
                                flow.next(data)
                            })
                        )
                })
            })
            .addStep((flow, data) => {
                tg.telegram.sendMessage(data.user.id, `Great, ${data.user.chatUsername}! I’ve informed group admins that you’d like to join, please wait for the confirmation.`)

                event.emit('getApprove', data.user)

                flow.next(data)
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow)
            })
            .execute({ user: user })
    }

    getAdmin(user, pass) {
        let { tg, event, db, config } = this.bundle

        flowManager
            .create()
            .addStep((flow, data) => {
                data.user.status == 'admin' ? (
                    tg.telegram.sendMessage(data.user.id, 'You are already admin!'),
                    flow.next(data)
                ) : (
                        pass == config.ADMIN_PASS ? (
                            data.user.status = 'admin',
                            data.user.save((err, user) => {
                                err && console.error('~~~ Error while setting admin right:', err)
                                tg.telegram.sendMessage(data.user.id, 'Granting you superpowers… Now you are group administrator!')
                                flow.next(data)
                            })
                        ) : (
                                tg.telegram.sendMessage(data.user.id, 'Enter command with the right pass!'),
                                flow.next(data)
                            )
                    )
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow)
            })
            .execute({ user: user })
    }

    getApprove(user, userToApprove) {
        let { tg, event, db } = this.bundle

        flowManager
            .create()
            .addStep((flow, data) => {
                let options = {
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: []
                    }
                }

                options.reply_markup.inline_keyboard.push([{ text: 'Yes', callback_data: { isApproved: true, id: userToApprove.id } }])
                options.reply_markup.inline_keyboard.push([{ text: 'No', callback_data: { isApproved: false, id: userToApprove.id } }])

                tg.telegram.sendMessage(data.user.id, `New join request from #${userToApprove.id} ${userToApprove.username ? '(@' + userToApprove.username + ')' : ''} with username ${userToApprove.chatUsername}. Accept?`, options)

                flow.next(data)
            })
            .addStep((flow, data) => {
                event.once(`getApprove:${userToApprove.id}`, query => {
                    query.isApproved ? (
                        tg.telegram.sendMessage(data.user.id, `User ${userToApprove.chatUsername} joined the group chat.`),
                        flow.next(data)
                    ) : (
                        tg.telegram.sendMessage(data.user.id, `You refused to ${userToApprove.chatUsername} joining group chat.`),
                        flow.nextFrom(4, data)
                    )
                })
            })
            .addStep((flow, data) => {
                event.emit('initMessaging', userToApprove)
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow)
            })
            .execute({ user: user })
    }

    initMessaging(user) {
        let { tg, event, db, chat } = this.bundle

        flowManager
            .create()
            .addStep((flow, data) => {
                let options = {
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: []
                    }
                }

                options.reply_markup.inline_keyboard.push([{ text: 'Yes', callback_data: { isAgreed: true, id: data.user.id } }])
                options.reply_markup.inline_keyboard.push([{ text: 'No', callback_data: { isAgreed: false, id: data.user.id } }])

                tg.telegram.sendMessage(data.user.id, `Good news, ${data.user.chatUsername}! You were authorized to join the group. Please note the rules before we proceed: “...........”`, options)

                flow.next(data)
            })
            .addStep((flow, data) => {
                event.once(`initMessaging:${data.user.id}`, query => {
                    query.isAgreed ? (
                        tg.telegram.sendMessage(data.user.id, `Nice to have you on board. Here’s the recent history of group communication:`),
                        flow.next(data)
                    ) : (
                        tg.telegram.sendMessage(data.user.id, `You refused to ${userToApprove.chatUsername} joining group chat.`),
                        flow.nextFrom(4, data)
                    )
                })
            })
            .addStep((flow, data) => {
                let lastHistory = chat.slice(-30), timerCounter = 0

                lastHistory && lastHistory.forEach(msg => {
                    setTimeout(() => {
                        tg.telegram.sendMessage(data.user.id, `${msg.chatUsername}: (${new Date(msg.timestamp).toLocaleString()}) ${msg.message.data}`)
                    }, timerCounter * 35);
                })
            })
            .addStep((flow, data) => {
                flowManager.destroy(flow)
            })
            .execute({ user: user })
    }
}

module.exports = Handler;