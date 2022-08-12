//** This file handles fetching attachments from Airtable and sending media content  to WhatsApp*/


const request = require('request-promise')
const airtable = require('./airtable-methods')
var Airtable = require('airtable');
require('dotenv').config("./env")
var path = require('path')
const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.TOKEN;

const bot = new TelegramBot(TOKEN, { filepath: true });

var base = new Airtable({ apiKey: process.env.apiKey }).base(process.env.base);

/**
 * Check if the module contains any files
 * If yes, then fetch the file name and file URL from Airtable, and send the file based on its type.
 * @param {number} cDay - Current Day
 * @param {number} cModule - Current Module
 * @param {number} number - Phone number
 */

async function sendMediaFile(cDay, cModule, number) {

    var course_tn = await airtable.findTable(number).then(`Table name of ${number} is ${course_tn}`).catch(e => console.log(e))
    const records = await base(course_tn).select({
        filterByFormula: "({Day} =" + cDay + ")",
        view: "Grid view",

    }).all(
    );

    records.forEach(async function (record) {
        img = record.get("Module " + cModule + " File")

        if (img != undefined) {
            len = img.length

            for (i = 0; i < len; i++) {
                filename = img[i].filename

                // Get File extension
                file_ext = path.extname(filename)
                imgurl = img[i].url

                var body = await load(imgurl)
                console.log("Delay of sending images")
                if (file_ext == ".mp4") {

                    const fileOptions = {
                        // Explicitly specify the file name.
                        filename: filename,
                        // Explicitly specify the MIME type.
                        contentType: "video/mp4",
                    };
                    bot.sendVideo(number, body, {}, fileOptions)
                }
                else if (file_ext == ".png" || file_ext == ".jpg") {
                    const fileOptions = {
                        // Explicitly specify the file name.
                        filename: filename,
                        // Explicitly specify the MIME type.
                        contentType: "image/*",
                    };
                    bot.sendPhoto(number, body, {}, fileOptions)
                }
                else if (file_ext == ".txt" || file_ext == ".pdf" || file_ext == ".xlsx") {
                    const fileOptions = {
                        // Explicitly specify the file name.
                        filename: filename,
                        // Explicitly specify the MIME type.
                        contentType: "text/*",
                    };

                    bot.sendDocument(number, body, {}, fileOptions)
                }
            }
        }
    });
}

function load(uri) {
    return new Promise((resolve, reject) => {
        const options = {
            uri: uri,
            encoding: null
        };
        const body = request(options)
        resolve(body)
    })
}

module.exports = { sendMediaFile }


