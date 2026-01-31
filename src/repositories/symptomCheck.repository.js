/**
 * SymptomCheck Repository
 * Data access layer for symptom check sessions
 */

import { BaseRepository } from './base.repository.js';
import SymptomCheck from '../models/symptomCheck/symptomCheck.model.js';

class SymptomCheckRepository extends BaseRepository {
  constructor() {
    super(SymptomCheck);
  }

  /**
   * Find all symptom checks for a patient
   */
  async findByPatientId(patientId, options = {}) {
    return await this.find(
      { patientId },
      { sort: { createdAt: -1 }, ...options }
    );
  }

  /**
   * Add a message to the conversation
   */
  async addMessage(sessionId, role, content) {
    return await this.model.findByIdAndUpdate(
      sessionId,
      {
        $push: {
          conversation: {
            role,
            content,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
  }

  /**
   * Update analysis results
   */
  async updateAnalysis(sessionId, analysis) {
    const updateData = {};

    if (analysis.suggestedConditions) {
      updateData.suggestedConditions = analysis.suggestedConditions;
    }
    if (analysis.recommendedSpecialist) {
      updateData.recommendedSpecialist = analysis.recommendedSpecialist;
    }
    if (analysis.severity) {
      updateData.severity = analysis.severity;
    }
    if (analysis.symptoms) {
      updateData.symptoms = analysis.symptoms;
    }
    if (analysis.isComplete !== undefined) {
      updateData.isComplete = analysis.isComplete;
    }

    return await this.updateById(sessionId, updateData);
  }

  /**
   * Mark session as used for appointment
   */
  async markUsedForAppointment(sessionId, appointmentId) {
    return await this.updateById(sessionId, {
      usedForAppointment: true,
      appointmentId
    });
  }

  /**
   * Get recent sessions for a patient (last 30 days)
   */
  async getRecentSessions(patientId, limit = 10) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await this.find(
      {
        patientId,
        createdAt: { $gte: thirtyDaysAgo }
      },
      {
        sort: { createdAt: -1 },
        limit
      }
    );
  }

  /**
   * Get completed sessions with recommendations
   */
  async getCompletedWithRecommendations(patientId) {
    return await this.find(
      {
        patientId,
        isComplete: true,
        recommendedSpecialist: { $ne: null }
      },
      { sort: { createdAt: -1 } }
    );
  }
}

export const symptomCheckRepository = new SymptomCheckRepository();
export default symptomCheckRepository;
