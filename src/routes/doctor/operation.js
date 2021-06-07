const express = require('express');
const { getPatientList, doctorSetting ,updateDoctorSettings ,approveAppointments ,addReviews, getDoctorReviews, contact,getNotification,removeNotification ,uploadImage} = require('../../controller/doctor/doctor.action');
// const { requireSignin } = require('../../common-middleware/index');
const router = express.Router();

router.get('/doctor/getPatientList/:id',getPatientList);
router.get('/doctor/doctorSetting/:id',doctorSetting);
router.post('/doctor/updateDoctorSettings/:id',updateDoctorSettings);
router.post('/doctor/approveAppointments/:id',approveAppointments);
router.post('/doctor/addReviews/:id',addReviews);
router.get('/doctor/getReviews/:id', getDoctorReviews);
router.get('/doctor/getNotification/:id', getNotification);
router.post('/doctor/contact',contact);
router.post('/doctor/image/:id',uploadImage);
router.post('/doctor/removeNotification', removeNotification);

module.exports = router;
