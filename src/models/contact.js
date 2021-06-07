const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contactSchema = new mongoose.Schema(
  {
    uniqueContact: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true,
        lowercase: true,
    },
    userId :{
        type: String,
        required: true,
    },
    role:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
      },
  name:{
      type:String,
      required:true
  },

  number :{
      type : Number,
      required:true
  },
  message :{
      type : String,
      required:true
  
  }
  },
  { timestamps: true }
);


module.exports = mongoose.model("Contacts", contactSchema);
