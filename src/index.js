const { Client, IntentsBitField } = require("discord.js")
const { token } = require("./config.json")

const client = new Client({
    intents : [

    ]
})

client.on('clientReady',(c) => {
    console.log(`${c.user.tag} is ready`)
})

client.on()

client.login(token)


