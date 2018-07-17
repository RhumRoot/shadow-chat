'use strict'


//Configs and 3-party init
const config = require('./config.json')
const PORT = process.env.PORT || 5000
const event = new (require('events'))

/* const Telegraf = require('telegraf')
const express = require('express')
const expressApp = express()


const bot = new Telegraf('657787507:AAFhAPCFmtWe9hHh2NEhf8_XFqx5ujzRq8M')

expressApp.use(bot.webhookCallback('/secret-path'))
bot.telegram.setWebhook('https://shadow-chat.herokuapp.com/secret-path')

expressApp.get('/', (req, res) => {
  res.send('Hello World!')
})

bot.command('start', (ctx) => ctx.reply('Hello rhum'))

expressApp.listen(PORT, () => {
  console.log('Example app listening on port 3000!')
}) */




//App&Bot init
const express = require('express')
const app = express()

const Telegraf = require('telegraf');
const tg = new Telegraf('657787507:AAFhAPCFmtWe9hHh2NEhf8_XFqx5ujzRq8M')

const db = new (require('./db/client'))


//App&Bot configuring
app.use(tg.webhookCallback('/telegram'))

tg.telegram.setWebhook('https://shadow-chat.herokuapp.com/telegram').then(success => {
    console.log(success)
}, err => {
    console.log(`~~~ Error while building bot`)
    console.log(err)
})

tg.command('start', ctx => {
    let tgUser = ctx.message.from

    console.log('start command for user: ', JSON.stringify(tgUser))

    /* db.getUser(tgUser.id, user => {
        !user && db.createUser(tgUser, user => {
            handler.start(user)
        })
    })  */
})

//Bot launching
const bundle = { tg, db, event, config }

//const bot = new (require('../bot/bot.js'))(bundle)



app.listen(PORT, console.info(`Bot is working on ${PORT} port`))
