const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const doctorSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 20,
    },
    image:{
      type:String
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 20,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    hash_password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["patient", "doctor"],
      default: "doctor",
    },
    image:{
      type:String
    },
    
    gender: {
      type: String,
      trim: true,
      required : true,
      default: null
    },
    pincode: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      min: 10,
      max: 100,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },

   age:
     {
        type: Number
     },

    number:
     {
        type: String,
        required : true,
      },
      speciality:{
        type:String,
      },
      notification:[ Schema.Types.Mixed]
  },
  { timestamps: true }
);

doctorSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

doctorSchema.methods = {
  authenticate: async function (password) {
    return await bcrypt.compare(password, this.hash_password);
  },
};

module.exports = mongoose.model("Doctors", doctorSchema);
