const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const TOKEN = process.env.TOKEN;

const bot = new TelegramBot(TOKEN, { polling: false }, { filepath: false });
const airtable = require('./airtable-methods')
const main = require("./main")


//Refer to the document to understand how to setup webhooks https://github.com/ekatraone/Ekatra-Telegram-ChatBot#readme

const express = require('express')
const url = process.env.SERVER_URL;
const port = process.env.PORT;
bot.setWebHook(`${url}/telegram`);

const app = express();

app.use(express.json());

app.post(`/telegram`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

//Start Express Server
app.listen(port, () => {
    console.log(`Express server is listening on ${port}`);
});


/**
 * Create a record with name and chat id when /start command is received
 */

bot.onText(/\/start/, async (msg) => {
    chat_id = msg.chat.id
    first_name = msg.chat.first_name
    last_name = msg.chat.last_name

    if (first_name == undefined) {
        console.log(first_name)
        student_name = `${last_name}`
    }
    else if (last_name == undefined) {
        console.log(last_name)

        student_name = `${first_name}`
    }
    else {
        student_name = `${msg.chat.first_name} ${msg.chat.last_name}`
    }
    const createRecord = await airtable.createRecord(chat_id, student_name);
    bot.sendMessage(msg.chat.id, createRecord);
})

/**
 * * Method for /stop command - Delete student
 */
bot.onText(/\/stop/, async (msg) => {
    chat_id = msg.chat.id

    await airtable.deleteRecord(chat_id);
    bot.sendMessage(msg.chat.id, "Deleted");

})

/**
 * When entities == undefiend states that the message received is a text message and not a command
 * Send the text message to store_response function to check if it belongs to the list message.
 */
bot.on('message', msg => {
    //console.log(msg.entities == undefined)
    if (msg.entities == undefined) {
        console.log(`Message Received ${msg.text} by ${msg.chat.id}`)

        main.store_responses(msg.chat.id, msg.text).then().catch(e => { console.log("Store response error " + e) });

    }
})



// Perform the action accordingly if the user reacts to the inline keyboard 
bot.on('callback_query', function onCallbackQuery(example) {
    const action = example.data // This is responsible for checking the content of callback_data
    const msg_id = example.message.message_id
    const chat_id = example.from.id
    console.log(action)

    // When "Start" callback is received, send the modules where the learner last left off
    if (action == 'Start') {

        main.sendModuleContent(chat_id, msg_id).then().catch(e => { console.log("Start keyword error " + e) });
        hideInlineKeyboard(chat_id, msg_id)
    }
    // FM = Finish Module. When user clicks on Next Inline Keyboard, continue the flows
    if (action == 'FM') {

        main.markModuleComplete(chat_id)
        hideInlineKeyboard(chat_id, msg_id)
    }

    // FD = Finish Day. When user clicks on Finish Inline Keyboard.
    else if (action == 'FD') {
        main.markDayComplete(chat_id)
        hideInlineKeyboard(chat_id, msg_id)

    }

});

// Catch Polling error if set to true.
bot.on("polling_error", console.log);

const hideInlineKeyboard = (chat_id, msg_id) => {
    bot.editMessageReplyMarkup({
        reply_markup: {


            inline_keyboard: [
                [

                ],

            ]

        }
    }, {
        chat_id: chat_id,
        message_id: msg_id
    });
}
