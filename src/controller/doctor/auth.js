const Doctor = require("../../models/doctor");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");



exports.signup = (req, res) => {
  Doctor.findOne({ email: req.body.email }).exec(async(error, doctor) => {
    if (doctor)
      return res.json({
        error: "Doctor already registered",
      });

      const { firstName, lastName, email, password ,gender ,number } = req.body;
      const hash_password = await bcrypt.hash(password, 10);
      const _doctor = new Doctor({
        firstName : firstName,
        lastName : lastName,
        username: shortid.generate(),
        email: email,
        hash_password: hash_password,
        gender: gender,
        number: number
      });

      _doctor.save((error, data) => {
        if (error) 
        {
          console.log(error);
          return res.json({
            error: "Something went wrong",
          });
        }

        if (data)
         {
          return res.json({
            message: "Doctor registered Successfully..!",
          });
        }
      });
    });
};

exports.signin = (req, res) =>
 {
  Doctor.findOne({ email: req.body.email }).exec(async (error, doctor) => {
    if (error) 
        return res.json({ error:error});

    if (doctor) 
    {
      const isPassword = await doctor.authenticate(req.body.password);
      if (
        isPassword &&
        (doctor.role === "doctor" )
      ) {
        const token = jwt.sign(
          { _id: doctor._id, role: doctor.role },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );
        const { _id, firstName, lastName, email, role, fullName,gender,number } = doctor;
        res.cookie("token", token, { expiresIn: "1d" });
        return res.json({
          message:"Logged in succesfully",
          token,
          user: { _id, firstName, lastName, email, role, fullName ,gender,number},
        });
      } 
      else
       {
        return res.json({
          error: "Invalid Password",
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
  return res.json({
    message: "Signout successfully...!",
  });
};
