const express = require("express");
const env = require("dotenv");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

//routes

const patientRoutes = require("./src/routes/patient/auth");
const doctorRoutes = require("./src/routes/doctor/auth");

const patientOperationRoutes = require("./src/routes/patient/operation");
const doctorOperationRoutes =require("./src/routes/doctor/operation");


//environment variable or you can say constants
env.config();

// mongodb connection
// mongodb+srv://sanju:<password>@cluster0.mbzhi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority


mongoose
  .connect(
    `mongodb://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0-shard-00-00.ubtyv.mongodb.net:27017,cluster0-shard-00-01.ubtyv.mongodb.net:27017,cluster0-shard-00-02.ubtyv.mongodb.net:27017/${process.env.MONGO_DB_DATABASE}?ssl=true&replicaSet=atlas-bf4yg6-shard-0&authSource=admin&retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
  )
  .then(() => {
    console.log("Database connected");
  }).catch(()=>{
    console.log("Database not connected");
  });

app.use(cors());
app.use(express.json());

app.use("/api", doctorRoutes);
app.use("/api", doctorOperationRoutes);
app.use("/api", patientRoutes);
app.use("/api", patientOperationRoutes);

const PORT =process.env.PORT || 2000;

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

