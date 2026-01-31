/**
 * SymptomCheck Model
 * Stores AI symptom checker conversations and analysis
 */

import mongoose from 'mongoose';
import { ModelName, SymptomSeverity } from '../../config/constants.js';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const symptomCheckSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: ModelName.PATIENT,
    required: true
  },
  conversation: {
    type: [messageSchema],
    default: []
  },
  suggestedConditions: {
    type: [String],
    default: []
  },
  recommendedSpecialist: {
    type: String,
    default: null
  },
  severity: {
    type: String,
    enum: Object.values(SymptomSeverity),
    default: null
  },
  symptoms: {
    type: [String],
    default: []
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  usedForAppointment: {
    type: Boolean,
    default: false
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: ModelName.APPOINTMENT,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
symptomCheckSchema.index({ patientId: 1, createdAt: -1 });
symptomCheckSchema.index({ isComplete: 1 });

const SymptomCheck = mongoose.model(ModelName.SYMPTOM_CHECK, symptomCheckSchema);

export default SymptomCheck;
