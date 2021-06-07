const Doctor = require("../../models/doctor");
const Patient= require("../../models/patient");
const Appointment= require("../../models/appointments");
const Contact = require("../../models/contact");
const shortid = require("shortid");
var ObjectId=require('mongodb').ObjectId;


// @route 	GET /api/doctor/allAppointments/:id
// @desc 	Get all appointments

exports.getPatientList = (req, res) => {
	Appointment.find({"doctorId" :req.params.id})
		.then(appointment => {
			if (appointment) {
				res.send(appointment);
			}
		})
		.catch(err => console.log(err));
};

// @route 	GET /api/doctors/doctorSetting/:id
// @desc 	Get settings from db
// @access 	Private

exports.doctorSetting = (req, res) => {
		Doctor.findById(req.params.id)
			.then(doc => {
				if (doc) {
					res.send(doc);
				}
			})
			.catch(err => console.log(err));
	};



// @route 	POST /api/doctor/updateSettings
// @desc 	Update, set settings for doctor
// @access 	Private

exports.updateDoctorSettings =(req, res) => {
	const newUser = req.body.settings;
	Doctor.findOneAndUpdate({"_id": new ObjectId(req.params.id)},newUser,{new:true,upsert: true},function(err,pat){
		if(err){
			return res.send({error: err});
		}
		console.log(newUser);
		return res.send('Succesfully saved.');
	});		
};

// @route 	GET /api/doctors/appointments/:id
// @desc 	Get appointments from db
// @access 	Private

exports.approveAppointments = (req, res) => {

	Appointment.findById(req.params.id).exec(async (error, appointment) => {
		if (appointment)
		{
			console.log(appointment);
	      appointment.status= 'approved';		
          appointment.save();
		  const dNotification={
			a_id : appointment._id,
			message : `${appointment.doctorName} has approved your appointment. ` 
		   };

		Patient.findById(req.body.patientId).exec(async (error, patient) => {
			if (patient)
			{
				patient.notification.push(dNotification);
				patient.save();
				console.log(patient.notification);
			  }});
		  return res.json({
			message: "Appointment for this patient is approved",
			appointment:appointment
		  });
		};
		return res.send('something went wrong');
	});
};
// @route 	POST /api/doctors/appointments/add
// @desc 	Adding appointments to both users
// @access 	Private

exports.addReviews =(req, res) => {
		const { review } = req.body;
		Appointment.findById(req.params.id).exec(async (error, appointment) => {
			if (appointment)
			{
				appointment.reviews.push(review);
				appointment.save();
			  return res.json({
				message: "Review added Successfully",
				appointment:appointment
			  });
			};
			return res.send('something went wrong');
		});
	};

exports.getDoctorReviews = (req, res) => {
	Appointment.find({"doctorId" :req.params.id})
			.then(appointment => {
				if (appointment) {
					res.send(appointment.reviews);
				}
			})
			.catch(err => {
				console.log(err);
				res.send({error: err});
			}) ; 
	};


exports.contact = (req, res) => {
	
		const newUser = req.body;
		
		Contact.findOneAndUpdate({"userId": new ObjectId(req.body.userId)},newUser,{new:true,upsert: true},function(err,con)
		{		
		   // consoloe.log(pat);	
		   if(con)
		   {
			return res.json({
				message : "Again, thank you for contacting us.",
			  });
			}
			 if(err)
			 {
				const { userId, name, email,number,message,role } = req.body;
				const _contact = new Contact({
			
					uniqueContact: shortid.generate(),	  
				  userId:userId,
				   name:name,
				   email:email,
				   role:role,
				   number:number,
				   message:message
				});
			
				_contact.save((error, data) => {
				  if (error) {
					//   console.log(error);
					return res.json({
					  error: "Something went wrong in saving details",
					});
				  }
			
				  if (data) {
				   
					return res.json({
					  message : " Thanks for contacting us!",
					});
				  }
				});
			}
			});		
		};

   exports.getNotification = (req, res) => {
			Doctor.findById(req.params.id)
				.then(doctor => {
					if (doctor) {
						res.send(doctor.notification);
					}
				})
				.catch(err => {
					console.log(err);
					res.send({error: err});
				}) ; 
		};	

		exports.removeNotification = (req, res) => {
			const { doctorId, appointmentId } = req.body;
			Doctor.findById(doctorId)
				.then(doctor => {
					if (doctor) {
						var arr = doctor.notification;
						var index = arr.findIndex(function(a){
							return a.a_id == appointmentId;
					   })
					   
					   if (index !== -1){
						console.log(index);
					       arr.splice(index, 1);
						   doctor.notification=arr;
						doctor.save();
					}
					       return res.json({
							notification:doctor.notification,
							message : " Notification removed successfully.",
						  });
						}	   
						
				})
				.catch(err => {
					console.log(err);
					return res.json({
						error: "Something went wrong in saving details",
					  });
				}) ; 
		};	


		exports.uploadImage =(req, res) => {
			const { image } = req.body;
			Doctor.findById(req.params.id).exec(async (error, doctor) => {
				if (doctor)
				{
					doctor.image=image;
					doctor.save();
				  return res.json({
					message: "profile pic updated",
					doctor:doctor
				  });
				};
				return res.send('something went wrong');
			});
		};

    		
		
