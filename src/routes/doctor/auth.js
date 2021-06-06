const express = require('express');
const { signup, signin, signout } = require('../../controller/doctor/auth');
// const { requireSignin } = require('../../common-middleware/index');
const router = express.Router();


router.post('/doctor/signup', signup);
router.post('/doctor/signin', signin);
router.get('/doctor/signout', signout);


module.exports = router;