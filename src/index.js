const { Client, GatewayIntentBits } = require("discord.js")
const { google } = require('googleapis')

require('dotenv').config()

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

const client = new Client({
    intents : [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

const FormatDate = (date) => {
    var today
    var startcut
    var lastcut
    if(typeof date == "string"){
        today = date
        startcut = today.indexOf('/')
        lastcut = today.lastIndexOf('/')
    }
    else{
        today = date.toLocaleDateString().replaceAll('/','-')
        startcut = today.indexOf('-')
        lastcut = today.lastIndexOf('-')
    }
    

    let day = today.slice(0,startcut)
    let month = today.slice(startcut+1,lastcut)
    let year = today.slice(lastcut+1,date.length)

    return new Date(year + "-" + month + "-" + day)
}

let datas = {
    row:0,
    header:[],
    contents:[],
    news:[]
}
let today = new Date()

const printMode = async (mode) => {
    const channel = await client.channels.fetch(textchannelid)

    if(mode == "G"){ //General Report
        let incoming = 0
        let urgent = 0
        let high = 0
        let total = 0

        for(let content of datas.contents){
            if(content[6] == "In Progress"){
                total += 1
            }
            if(content[6] == "In Progress" && today - FormatDate(content[1]) <= (1000 * 60 * 60 * 24 * 3) && today - FormatDate(content[1]) > 0){//3 days
                incoming += 1
            }
            if(content[6] == "In Progress" && content[5] == "Urgent"){
                urgent += 1
            }
            if(content[6] == "In Progress" && content[4] == "Must have"){
                high += 1
            }

        }

        channel.send(new Date().toLocaleDateString() + " - " + total + " Meeting issues")
        channel.send(incoming + " Incoming, " + urgent + " Urgent, " + high + " Must have")
        for(let content of datas.contents){
            if(content[6] == "In Progress" && today - FormatDate(content[1]) <= (1000 * 60 * 60 * 24 * 3) && today - FormatDate(content[1]) > 0){
                channel.send("- Issue " + content[1] + " : " + content[2] + " (" + Math.ceil((today - FormatDate(content[1]))/(1000 * 60 * 60 * 24)) + " day)")
            }
        }
    } 
    else if(mode == "N"){ //New Issues Report
        let total = 0
        
        for(let content of datas.contents){
            if(content[6] == "In Progress"){
                total += 1
            }
        }
        channel.send(new Date().toLocaleDateString() + " - " + total + " --> " + (total+datas.news.length) + " Meeting Issues")
        channel.send("New Issues")
        for(let content of datas.news){
            channel.send("- Issue " + content[0] + " : " + content[2])
        }
    } 
}

const getSheetdata = async (isprint) => {
    let mode = "G"
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId:process.env.SPREADSHEETID,
        range:'table!A:G'
    })

    datas.contents = []
    datas.news = []

    //new row updated
    if(response.data.values.length-1 > datas.row && datas.row != 0){
        for(let i= datas.row+1 ;i <= response.data.values.length-1 ;i++){
            datas.news.push(response.data.values[i])
        }
        mode = "N"
    }
    
    let count = 0
    for(let row of response.data.values){
        count == 0 ? datas.header = row : datas.contents.push(row)
        count += 1
    }
    datas.row = count - 1

    console.log(datas)

    if(isprint){
        printMode(mode)
    }
}

let textchannelid = "" 

client.on('clientReady',async (c) => {
    console.log(`${c.user.tag} is ready`)

    //get channel id for bot messages 
    const gulid = client.guilds.cache.get(process.env.DISCORD_GULIDID)
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

    getSheetdata(true)
})

client.on('presenceUpdate',async (oldpresence,newpresence) => {
    const channel = await client.channels.fetch(textchannelid)
    if(newpresence.status == "online"){
        getSheetdata(true)
        channel.send("hello " + newpresence.member.user.globalName)
    }
    else if(newpresence.status == "offline"){
        getSheetdata(true)
        channel.send("goodbye " + newpresence.member.user.globalName)
    }
})

client.on('voiceStateUpdate',async (oldstate,newstate) => {
    //check if user join a channel
    if(textchannelid !== ""){
        if(oldstate.channelId === null && newstate.channelId !== null){
            const channel = await client.channels.fetch(textchannelid)
            channel.send("hello voice channel " + newstate.member.user.globalName)
            getSheetdata(true)
        }
    }
})



client.login(process.env.DISCORD_TOKEN)



