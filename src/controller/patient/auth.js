const Patient = require("../../models/patient");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");

const generateJwtToken = (_id, role) => {
  return jwt.sign({ _id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

exports.signup = (req, res) => {
  Patient.findOne({ email: req.body.email }).exec(async (error, patient) => {
    if (patient)
      return res.json({
        error: "Patient already registered",
      });

    const { firstName, lastName, email, password, gender,number} = req.body;
    const hash_password = await bcrypt.hash(password, 10);
    const _patient = new Patient({
      firstName: firstName,
      lastName: lastName,
      email: email,
      hash_password: hash_password,
      username: shortid.generate(),
      gender: gender,
      number: number
    });

    _patient.save((error, data) => {
      if (error) {
        console.log(error);
        return res.json({
          error: "Something went wrong ",
        });
      }

      if (data) {
       
        return res.json({
          message : "Patient registered successfully !",
        });
      }
    });
  });
};

exports.signin = (req, res) => {
  Patient.findOne({ email: req.body.email }).exec(async (error, patient) => {
    if (error) 
        return res.json({ error });
    if (patient) 
    {
      const isPassword = await patient.authenticate(req.body.password);
      if (isPassword && patient.role === "patient") 
      {
        const token = generateJwtToken(patient._id, patient.role);
        const { _id, firstName, lastName, email, role, fullName,gender,number } = patient;
        res.cookie("token", token, { expiresIn: "1d" });
        return res.json({
          message:"Logged in successfully",
          token,
          user: { _id, firstName, lastName, email, role, fullName,gender,number },
        });
      } else {
        return res.json({
          error: "INVALID CREDENTIAL",
        });
      }
    } 
    else 
    {
      return res.json({ error: "Something went wrong" });
    }
  });
};

exports.signout = (req, res) => 
{
  res.clearCookie("token");
  return res.status(200).json({
    message: "Signout successfully...!",
  });
};
