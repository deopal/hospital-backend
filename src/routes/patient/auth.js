const express = require('express');
const { signup, signin, signout } = require('../../controller/patient/auth');
// const { requireSignin } = require('../../common-middleware/index');
const router = express.Router();


router.post('/patient/signup', signup);
router.post('/patient/signin', signin);
router.get('/patient/signout', signout);


// router.post('/profile', requireSignin, (req, res) => {
//     res.status(200).json({ user: 'profile' })
// });

module.exports = router;