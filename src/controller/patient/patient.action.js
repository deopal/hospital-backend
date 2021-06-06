const Doctor = require("../../models/doctor");
const Patient = require("../../models/patient");
const Appointment = require("../../models/appointments");
const Contact = require("../../models/contact");
var ObjectId = require('mongodb').ObjectID;
const shortid = require("shortid");

exports.doctorPresent = async (req, res) => 
{
    try{
    const DoctorList = await Doctor.find({}).exec();
    return res.json({
      doctorList: DoctorList
    });
    }
    catch(err){
        console.log("Fetching Doctor failed ..!");
		res.send({error: err})
    }
  };


exports.doctorByid = async (req, res) => 
{
    Doctor.findById(req.params.id)
			.then(doctor =>
			 {
				if (doctor) 
				{
					res.send(doctor);
				}
			})
			.catch(err => {
				console.log(err);
				res.send({error: err});
			})  
  };
  
 // @route 	POST /api/patients/makeAppointment
// @desc 	patient ask for appointment to doctor
// @desc		
// @access 	Private

exports.makeAppointment = (req, res) => {
	Appointment.findOne({$and:[{ patientId: req.body.patientId ,doctorId: req.body.doctorId }]}).exec(async (error, appointment) => {
		
		if (appointment){
		  return res.json({
			error: "Patient already have appointment to this doctor",
		  });
		}

		if(error){
			console.log(error);
			return res.json({
				error: "something went wrong"
			  });
		}
	
		const { patientId,doctorId,patientName, age, adharNumber,number, gender, healthProblems, previousRecords} = req.body;
		const _appointment = new Appointment({
		  patientId: patientId,
		  uniqueAppointment: shortid.generate(),
		  doctorId: doctorId,
		  patientName: patientName,
		  age: age,
		  adharNumber: adharNumber,
		  number: number,
		  gender: gender,
		  healthProblems: healthProblems,
		  previousRecords: previousRecords
		});
	
		_appointment.save((error, data) => {
		  if (error) {
			  console.log(error);
			return res.json({
			  error: "Something went wrong",
			});
		  }
	
		  if (data) {
                
			const dNotification={

				a_id : data._id,
				messaage : `${patientName} has requsted an appointment ` 
			   };

			Doctor.findById(doctorId).exec(async (error, doctor) => {
				if (doctor)
				{
					doctor.notification.push(dNotification);
					doctor.save();
				  }});

			return res.status(201).json({
			  message : " Appointment request has been sent ",
			});
		
		};
		});
	  });
	};


  // @route 	GET /api/patients/patientSettings/:id
// @desc 	Get patient`s settings, for filling forms, etc
// @access 	Private

exports.patientSetting =(req, res) => {
		Patient.findById(req.params.id)
			.then(patient =>
			 {
				if (patient) 
				{
					res.send(patient);
				}
			})
			.catch(err => {
				console.log(err);
				res.send({error: err});
			})  
	};

// @route 	POST /api/patient/updateSettings
// @desc 	Update, set settings for patient
// @access 	Private

exports.updateSettings =(req, res) => {
		const newUser = req.body.settings;
		Patient.findOneAndUpdate({"_id": new ObjectId(req.params.id)},newUser,{new:true,upsert: true},function(err,pat){
			if(err){
				return res.send({error: err});
			}
			console.log(newUser);
			return res.send('Succesfully saved.');
		});		
	};

// @route 	GET /api/patients/allAppointments/:id
// @desc 	Get all patient appointments
// @access 	Private

exports.allAppointments = (req, res) => {
	console.log(req.params.id);
		Appointment.find({"patientId":req.params.id})
			.then(appointment => {
				if (appointment) {
					console.log(appointment);
					res.send(appointment);
				}
			})
			.catch(err => {
				console.log(err);
				res.send({error: err});
			}) ;
	};


exports.AppointmentById = (req, res) => {
	console.log(req.params.id);
		Appointment.findById(req.params.id)
			.then(appointment => {
				if (appointment) {
					console.log(appointment);
					res.send(appointment);
				}
			})
			.catch(err => {
				console.log(err);
				res.send({error: err});
			}) ;
	};

//@ post request for status completion of appointment

exports.completeAppointments = (req, res) => {

	Appointment.findById(req.params.id).exec(async (error, appointment) => {
		if (appointment)
		{
	      appointment.status= 'completed';		
          appointment.save();
		  return res.json({
			message: "Patient appointment to this doctor has completed",
			appointment:appointment
		  });
		};
		return res.send('something went wrong');
	});
};

exports.getReviews = (req, res) => {
	Appointment.find({"patientId" :req.params.id})
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
			const { userId, name, email,number,message } = req.body;
			const _contact = new Contact({
		
			  uniqueAppointment: shortid.generate(),	  
			  userId:userId,
			   name:name,
			   email:email,
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
		Patient.findById(req.params.id)
			.then(patient => {
				if (patient) {
					res.send(patient.notification);
				}
			})
			.catch(err => {
				console.log(err);
				res.send({error: err});
			}) ; 
	};
	

	exports.removeNotification = (req, res) => {
		const { patientId, appointmentId } = req.body;
		Patient.findById(patientId)
			.then(patient => {
				if (patient) {
					var arr = patient.notification;
					var index = arr.findIndex(function(a){
						return a.a_id === appointmentId;
				   })
				   if (index !== -1) 
					   arr.splice(index, 1);
					   return res.json({
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
