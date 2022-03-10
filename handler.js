require('dotenv').config({ path: './.env' });

const lodash = require('lodash');
const validator = require('validator');
const connectToDatabase = require('./db');
const Note = require('./models/Note');

/** 
 * Helper function
 * @param {*} statusCode
 * @param {*} message
 * @returns
 */

const createErrorResponse = (statusCode, message) => ({
  statusCode: statusCode || 501,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringfy({
    error: message || 'An Error occurred',
  }),
});

/**
 * @param {*} error Error message
 */

const returnError = (error) => {
  console.log(error);
  if (error.name) {
    const message = `Invalid ${error.path}: ${error.value}`;
    callback(null, createErrorResponse(400, `Error::${message}`));
  } else {
    callback(
      null,
      createErrorResponse(error.statusCode || 500, `Error::${error.name}`)
    )
  }
}

module.exports.create = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log('eit')
  if(lodash.isEmpty(event.body)) {
    return callback(null, createErrorResponse(400, 'Missing details'));
  }
  const { title, description, reminder, status, category } = JSON.parse(
    event.body
  );

  const noteObj = new Note({
    title,
    description,
    reminder,
    status,
    category
  });

  if (noteObj.validateSync()) {
    return callback(null, createErrorResponse(400, 'Incorrect note details'));
  }

  try {
    await connectToDatabase();
    console.log(noteObj);
    const note = await Note.create(noteObj);
    callback(null,{
      statusCode: 200,
      body: JSON.stringify(note)
    })
  } catch (error) {
    returnError(error)
  }
}

module.exports.getOne = async (event, context, callback) =>{
  context.callbackWaitsForEmptyEventLoop = false;
  const id = event.pathParameters.id;
  if(!validator.isAlphanumeric(id)){
    callback(null, createErrorResponse(400, 'Incorrect id'));
    return;
  }

  try {
    await connectToDatabase();
    
    const note = await Note.findById(id);
    if (!note){
      callback(null, createErrorResponse(404, `No note found with id: ${id}`))
    }

    callback(null,
      {
        statusCode: 200,
        body: JSON.stringify(note)
      })
  } catch (error) {
    returnError(error)
  }
}

module.exports.getAll = async (event, context, callback)=>{
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    await connectToDatabase();
    const notes = await Note.find();
    if (!notes){
      callback(null, createErrorResponse(404, 'No notes found'));
    }
    callback(null,{
      statusCode: 200,
      body: JSON.stringify(notes)
    })
  } catch (error) {
    returnError(error)
  }
}

module.exports.update = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const data = JSON.parse(event.body);

  if(!validator.isAlphanumeric(event.pathParameters.id)){
    return callback(null, createErrorResponse(400, 'Incorrect Id'));
  }

  if(lodash.isEmpty(data)) {
    return callback(null, createErrorResponse(400, 'Missing details'));
  }

  const { title, description, reminder, status, category } = data;

  try {
    await connectToDatabase();

    const note = await Note.findById(event.pathParameters.id);
    console.log(note)
    console.log(reminder)
    if (note) {
      note.title = title || note.title;
      note.description = description || note.description;
      note.reminder =  !lodash.isNull(reminder) && !lodash.isUndefined(reminder) ? reminder : note.reminder;
      note.status = status || note.status;
      note.category = category || note.category;
    }

    const newNote = await note.save();

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(newNote)
    });

  } catch (error) {
    returnError(error)
  }
}

module.exports.delete = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const id = event.pathParameters.id;

  if(!validator.isAlphanumeric(id)) {
    return callback(null, createErrorResponse(400, 'Icorrect Id.'));
  }

  try {
    await connectToDatabase();
    const note = await Note.findByIdAndRemove(id);
    callback(null,{
      statusCode: 200,
      body: JSON.stringify(`Removed note with success`)
    })
  } catch (error) {
    returnError(error)
  }
}