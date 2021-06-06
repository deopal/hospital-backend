const jwt = require("jsonwebtoken");
const shortid = require("shortid");
const path = require("path");


exports.requireSignin = (req, res, next) => {
  
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;

  } 
  else
   {
    return res.json({ message: "Authorization required" });
  }
  
  next();
  //jwt.decode()
};

