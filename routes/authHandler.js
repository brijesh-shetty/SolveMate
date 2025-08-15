const express = require('express');
const authRouter = express.Router();

const authController = require('../controller/authController');   

// GET /
authRouter.get('/login', authController.getLogin);

// POST 
authRouter.post('/login', authController.postLogin);

authRouter.post("/logout", authController.postLogout);
authRouter.get("/signup", authController.getSignup);
authRouter.post("/signup", authController.postSignup)
module.exports = authRouter;
