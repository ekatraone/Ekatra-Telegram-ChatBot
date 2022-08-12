//** This file handles Airtable operations* /

var Airtable = require('airtable');
require('dotenv').config();

var base = new Airtable({ apiKey: process.env.apiKey }).base(process.env.base);
table = base('Telegram-Students')

/**
 * Update the column in Airtable.
 * @param {number} id - Unique row ID
 * @param {string} field_name - Field name to update
 * @param {*} updatedValue - Value to update
 */

const updateField = async (id, field_name, updateValue) => {

  base('Telegram-Students').update([
    {
      "id": id,
      "fields": {
        [field_name]: updateValue
      }
    }
  ], function (err, records) {
    if (err) {
      console.error(err);
      return;
    }
  });
}

/**
 * @param {number} id - Unique row ID
 * @param {string} name - Student name
 */
const createRecord = async (chat_id, name) => {

  const students = await table.select({
    filterByFormula: `ChatID = ${chat_id}`,
    view: "Grid view"
  }).all();
  var len = students.length;
  // console.log(len)
  return new Promise((resolve, reject) => {
    if (len == 0) {

      table.create([
        {
          "fields": {
            "ChatID": chat_id,
            "Name": name,
            "Course": "WomenWill",
            "Module Completed": 0,
            "Next Module": 1,
            "Day Completed": 0,
            "Next Day": 1
          }
        }
      ], function (err, records) {
        if (err) {
          console.error(err);
          reject(err);
        }
        else {

          resolve(`Hello Ramsha, You are successfully enrolled in WomenWill training Program.`)
        }

      });

    }
    else {
      resolve("Already registered")
    }
  })

}

/**
 * @param {number} id - Unique row ID
 * @returns - Deleted record ID 
 */
const deleteRecord = async (chat_id) => {
  const rec = await table.select({
    filterByFormula: `ChatID = ${chat_id}`,
    view: "Grid view"
  }).all();


  rec.forEach(function (record) {
    var id = record.get("ID");
    table.destroy(id, function (err, deletedRecord) {
      if (err) {
        console.error(err);
        return;
      }
      console.log('Deleted record', deletedRecord.id);
    });

  });
}

/**
 * Find total days in a given course.
 * @param {*} number 
 * @returns total days 
 */
const totalDays = async (number) => {

  var course_tn = await findTable(number)
  const course_table = await base(course_tn).select({
    //filterByFormula: "({Phone} = " + number + ")",
    fields: ["Day"],
    view: "Grid view"
  }).all();
  return new Promise((resolve, reject) => {
    count = 0

    course_table.forEach(function (record) {
      count += 1

    })
    //   console.log(count)
    resolve(count)
    reject("Error")
  })
}

/** 
 * Finds the course table of individual students.
 * Note: Course name and Course table name must be same.
 * @param {number} number - chat id
 * @returns course name 
 */
const findTable = async (number) => {
  const course_table = await base('Telegram-Students').select({
    filterByFormula: "({ChatID} = " + number + ")",
    view: "Grid view"
  }).all();

  return new Promise((resolve, reject) => {
    course_tn = ""
    course_table.forEach(function (record) {
      course_tn = record.get("Course")
      //    console.log("Table Name = " + record.get("Course"))
      resolve(course_tn)
      reject("error")

    })
  })
}

/**
 * Find the current value in Response column
 * @param {*} id 
 * @returns Response field value for given ID.
 */
const findRecord = async (id) => {
  return new Promise((resolve, reject) => {
    base('Student').find(id, function (err, record) {
      if (err) { console.error(err); return; }

      resolve(record.fields.Response);
    });
  }
  )
}

/**
 * Find the Title and list options for a given module number
 * @param {number} currentDay 
 * @param {number} module_no 
 * @returns List title and options for the particular module number
 */
const findTitle = async (number, currentDay, module_no) => {
  var course_tn = await findTable(number)
  const records = await base(course_tn).select({
    filterByFormula: "({Day} =" + currentDay + ")",
    view: "Grid view",

  }).all(
  );
  return new Promise((resolve, reject) => {
    records.forEach(function (record) {
      let title = record.get('Module ' + module_no + ' LTitle');
      let options = record.get('Module ' + module_no + ' List');
      if (title !== undefined) {
        resolve([title, options.split("\n")])
        reject("error")
      }
    })
  })
}

module.exports = {

  findTable,
  totalDays,
  createRecord,
  deleteRecord,
  updateField,
  findRecord,
  findTitle
}
