'use strict'


//Configs and 3-party init
const config = require('./config.json')
const PORT = process.env.PORT || 5000
const event = new (require('events'))

const Telegraf = require('telegraf')
const express = require('express')
const expressApp = express()


const bot = new Telegraf('595027497:AAEPox0u5V8bPSFyqPSuUv9vGvAfN9DgQoY')

expressApp.use(bot.webhookCallback('/secret-path'))
bot.telegram.setWebhook('https://shadow-chat.herokuapp.com/secret-path')

expressApp.get('/', (req, res) => {
  res.send('Hello World!')
})

bot.command('start', (ctx) => ctx.reply('Hello'))

expressApp.listen(PORT, () => {
  console.log('Example app listening on port 3000!')
})



/* 
//App&Bot init
const app = new (require('express'))
const bodyParser = require('body-parser')

const Telegraf = require('telegraf');
const tg = new Telegraf(config.BOT_TOKEN)

const db = new (require('./db/client'))


//App&Bot configuring
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(tg.webhookCallback('/telegram'))

tg.telegram.setWebhook(config.URL + '/telegram').then(success => {
    console.log(success)
}, err => {
    console.log(`~~~ Error while building bot`)
    console.log(err)
})

tg.command('start', ctx => {
    let tgUser = ctx.message.from

    console.log('start command for user: ', JSON.stringify(tgUser))

    db.getUser(tgUser.id, user => {
        !user && db.createUser(tgUser, user => {
            handler.start(user)
        })
    }) 
})

//Bot launching
const bundle = { tg, db, event, config }

//const bot = new (require('../bot/bot.js'))(bundle)



app.listen(PORT, console.info(`Bot is working on ${PORT} port`))
 */