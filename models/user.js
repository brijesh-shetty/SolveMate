// models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      
    },
    lastName: {
      type: String,
      
    },
    email: {
      type: String,
      required: true,
      
    },
    hashedPassword: {
      type: String,
      required: true,
     
    },
   solvedQuestions: [
    {
        type: mongoose.Schema.Types.ObjectId,
      ref: "Question" // This should match your Question model name
       }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
