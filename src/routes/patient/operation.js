const express = require('express');
const { doctorPresent, doctorByid ,makeAppointment, patientSetting, updateSettings, allAppointments, AppointmentById ,completeAppointments,getReviews,contact,getNotification,removeNotification ,uploadImage} = require('../../controller/patient/patient.action');
// const { requireSignin } = require('../../common-middleware');
const router = express.Router();

router.get('/patient/doctorPresent', doctorPresent);
router.get('/patient/doctorByid/:id',doctorByid);
router.post('/patient/makeAppointment',makeAppointment);
router.get('/patient/patientSetting/:id',patientSetting);
router.post('/patient/updateSettings/:id',updateSettings);
router.get('/patient/allAppointments/:id', allAppointments);
router.get('/patient/AppointmentById/:id', AppointmentById);
router.post('/patient/completeAppointment/:id', completeAppointments);
router.get('/patient/getReviews/:id', getReviews);
router.get('/patient/getNotification/:id', getNotification);
router.post('/patient/contact', contact);
router.post('/patient/image/:id',uploadImage);
router.post('/patient/removeNotification', removeNotification);


module.exports = router;
