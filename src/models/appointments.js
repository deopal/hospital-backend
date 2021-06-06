const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const appointmentSchema = new mongoose.Schema(
  {
    uniqueAppointment: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true,
        lowercase: true,
    },
    patientId :{
        type: String,
        required: true,
    },
    doctorId:
    {
        type: String,
        required: true,
    } ,
    status: 
    {
      type: String,
      enum: ["pending", "approved", "completed"],
      default: "pending",
    } ,
    reviews: [ Schema.Types.Mixed],
   /*
    {  
      doctor: {
          type:string
      },
      record:{
          type:string
      },
      date:{
         type:Date,
         default: Date.now
      }
    }
],
*/
  patientName:{
      type:String,
      required:true
  },
  doctorName:{
      type:String,
  },
  age :{
      type:Number
  },
  adharNumber :{
      type : Number,
      required:true,
  },
  number :{
      type : Number,
      required:true
  },
  gender :{
      type : String
  },
  healthProblems :{
      type : String,
      required:true
  },
  previousRecords :{
      type : String,
  }
  },
  { timestamps: true }
);


module.exports = mongoose.model("Appointments", appointmentSchema);
