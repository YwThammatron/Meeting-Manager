const { Client, GatewayIntentBits } = require("discord.js")
const { token,gulidId } = require("./config.json")

const client = new Client({
    intents : [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
})

let textchannelid = "" 

client.on('clientReady',async (c) => {
    console.log(`${c.user.tag} is ready`)

    //get channel id for bot messages
    const gulid = client.guilds.cache.get(gulidId)
    if(gulid){
        try{
            const channels = await gulid.channels.fetch()

            channels.forEach(channel => {
                if(channel.name == "general" && channel.type == 0){
                    textchannelid = channel.id
                }
            })
        }
        catch (error) {
            console.error('Error fetching channels:', error);
        }
    }
    
})

client.on('voiceStateUpdate',async (oldstate,newstate) => {
    //check if user join a channel
    if(textchannelid !== ""){
        if(oldstate.channelId === null && newstate.channelId !== null){
            const channel = await client.channels.fetch(textchannelid)
            console.log(channel)
            channel.send("hello")
        }
    }
    
})

client.login(token)


