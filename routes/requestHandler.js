const express = require('express');
const requestHandler = express.Router();
const Question = require('../models/question');
const { get } = require('mongoose');

const controller = require('../controller/control');


// GET /

requestHandler.get('/home', controller.getQuestion);

// POST /filter
// Middleware to protect /filter route


requestHandler.post('/filter', controller.filterQuestions);

module.exports = requestHandler;
