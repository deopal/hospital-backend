/**
 * Prescription PDF Service
 *
 * Generates professional PDF prescriptions for completed appointments.
 */

import PDFDocument from 'pdfkit';
import { appointmentRepository } from '../../repositories/index.js';

/**
 * Generate a prescription PDF for a completed appointment
 *
 * @param {string} appointmentId - The appointment ID
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generatePrescriptionPDF = async (appointmentId) => {
  // Get appointment with all details
  const appointment = await appointmentRepository.findByIdWithDetails(appointmentId);

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  if (appointment.status !== 'completed') {
    throw new Error('Prescription can only be generated for completed appointments');
  }

  // Get doctor and patient details
  const doctor = appointment.doctorId;
  const patient = appointment.patientId;
  const patientDetails = appointment.patientDetails;

  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        autoFirstPage: true,
        bufferPages: false,
        info: {
          Title: `Prescription - ${patientDetails?.name || 'Patient'}`,
          Author: `Dr. ${doctor?.firstName} ${doctor?.lastName}`,
          Subject: 'Medical Prescription',
          Creator: 'CareSync Hospital Management System'
        }
      });

      // Collect PDF data chunks
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with hospital branding
      drawHeader(doc, doctor);

      // Patient Information Section
      drawPatientInfo(doc, patientDetails, patient, appointment);

      // Diagnosis Section
      if (appointment.diagnosis) {
        drawDiagnosisSection(doc, appointment.diagnosis);
      }

      // Prescription Section (Rx)
      if (appointment.prescription) {
        drawPrescriptionSection(doc, appointment.prescription);
      }

      // Additional Notes
      if (appointment.notes) {
        drawNotesSection(doc, appointment.notes);
      }

      // Footer with signature
      drawFooter(doc, doctor, appointment);

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Draw the header section with hospital/doctor branding
 */
function drawHeader(doc, doctor) {
  const pageWidth = doc.page.width - 100;

  // Hospital/Clinic Name
  doc.fontSize(24)
     .fillColor('#0d9488')
     .font('Helvetica-Bold')
     .text('CareSync', { align: 'center' });

  doc.fontSize(10)
     .fillColor('#666')
     .font('Helvetica')
     .text('Hospital Management System', { align: 'center' });

  doc.moveDown(0.5);

  // Doctor Information
  doc.fontSize(14)
     .fillColor('#1f2937')
     .font('Helvetica-Bold')
     .text(`Dr. ${doctor?.firstName || ''} ${doctor?.lastName || ''}`, { align: 'center' });

  if (doctor?.speciality) {
    doc.fontSize(11)
       .fillColor('#4b5563')
       .font('Helvetica')
       .text(doctor.speciality, { align: 'center' });
  }

  if (doctor?.email) {
    doc.fontSize(9)
       .fillColor('#6b7280')
       .text(`Email: ${doctor.email}`, { align: 'center' });
  }

  if (doctor?.number) {
    doc.fontSize(9)
       .fillColor('#6b7280')
       .text(`Phone: ${doctor.number}`, { align: 'center' });
  }

  doc.moveDown();

  // Divider line
  doc.strokeColor('#0d9488')
     .lineWidth(2)
     .moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .stroke();

  doc.moveDown();
}

/**
 * Draw patient information section
 */
function drawPatientInfo(doc, patientDetails, patient, appointment) {
  const leftColumn = 50;
  const rightColumn = 350;

  doc.fontSize(12)
     .fillColor('#0d9488')
     .font('Helvetica-Bold')
     .text('PATIENT INFORMATION', leftColumn);

  doc.moveDown(0.5);

  const infoStartY = doc.y;

  // Left column - Patient details
  doc.fontSize(10)
     .fillColor('#374151')
     .font('Helvetica-Bold')
     .text('Name: ', leftColumn, infoStartY, { continued: true })
     .font('Helvetica')
     .text(patientDetails?.name || patient?.fullName || 'N/A');

  // Age and Gender
  const age = patientDetails?.age || '';
  const gender = patientDetails?.gender || '';
  doc.font('Helvetica-Bold')
     .text('Age/Gender: ', leftColumn, doc.y, { continued: true })
     .font('Helvetica')
     .text(`${age}${age ? ' years' : 'N/A'} / ${gender || 'N/A'}`);

  // Contact
  doc.font('Helvetica-Bold')
     .text('Contact: ', leftColumn, doc.y, { continued: true })
     .font('Helvetica')
     .text(patientDetails?.contactNumber || patient?.number || 'N/A');

  // Aadhar (if available)
  if (patientDetails?.adharNumber) {
    doc.font('Helvetica-Bold')
       .text('Aadhar No: ', leftColumn, doc.y, { continued: true })
       .font('Helvetica')
       .text(patientDetails.adharNumber);
  }

  // Save current Y position after left column
  const leftColumnEndY = doc.y;

  // Right column - Date and Ref No (positioned at same starting Y as left column)
  doc.fontSize(10)
     .fillColor('#374151')
     .font('Helvetica-Bold')
     .text('Date: ', rightColumn, infoStartY, { continued: true })
     .font('Helvetica')
     .text(formatDate(appointment.completedAt || appointment.updatedAt));

  // Appointment ID
  doc.font('Helvetica-Bold')
     .text('Ref No: ', rightColumn, doc.y, { continued: true })
     .font('Helvetica')
     .text(appointment._id.toString().slice(-8).toUpperCase());

  // Move to whichever column ended lower
  doc.y = Math.max(leftColumnEndY, doc.y);
  doc.moveDown(1.5);

  // Health Problems
  if (appointment.healthProblems) {
    doc.fontSize(10)
       .fillColor('#374151')
       .font('Helvetica-Bold')
       .text('Chief Complaint: ', leftColumn, doc.y, { continued: true })
       .font('Helvetica')
       .fillColor('#dc2626')
       .text(appointment.healthProblems);
  }

  doc.moveDown();

  // Thin divider
  doc.strokeColor('#e5e7eb')
     .lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .stroke();

  doc.moveDown();
}

/**
 * Draw diagnosis section
 */
function drawDiagnosisSection(doc, diagnosis) {
  doc.fontSize(12)
     .fillColor('#0d9488')
     .font('Helvetica-Bold')
     .text('DIAGNOSIS');

  doc.moveDown(0.3);

  doc.fontSize(10)
     .fillColor('#1f2937')
     .font('Helvetica')
     .text(diagnosis, {
       width: doc.page.width - 100,
       align: 'left'
     });

  doc.moveDown();

  // Thin divider
  doc.strokeColor('#e5e7eb')
     .lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .stroke();

  doc.moveDown();
}

/**
 * Draw prescription section with Rx symbol
 */
function drawPrescriptionSection(doc, prescription) {
  // Rx Symbol
  doc.fontSize(28)
     .fillColor('#0d9488')
     .font('Helvetica-Bold')
     .text('Rx', 50, doc.y);

  doc.moveDown(0.3);

  doc.fontSize(12)
     .fillColor('#0d9488')
     .font('Helvetica-Bold')
     .text('PRESCRIPTION', 50);

  doc.moveDown(0.5);

  // Parse prescription if it contains line breaks
  const prescriptionLines = prescription.split('\n');

  doc.fontSize(11)
     .fillColor('#1f2937')
     .font('Helvetica');

  let lineNum = 0;
  prescriptionLines.forEach((line) => {
    if (line.trim()) {
      lineNum++;
      doc.text(`${lineNum}. ${line.trim()}`, 70, doc.y, {
        width: doc.page.width - 120,
        align: 'left'
      });
      doc.moveDown(0.3);
    }
  });

  doc.moveDown(0.5);

  // Thin divider
  doc.strokeColor('#e5e7eb')
     .lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .stroke();

  doc.moveDown(0.5);
}

/**
 * Draw additional notes section
 */
function drawNotesSection(doc, notes) {
  doc.fontSize(12)
     .fillColor('#0d9488')
     .font('Helvetica-Bold')
     .text('ADDITIONAL NOTES / ADVICE');

  doc.moveDown(0.3);

  doc.fontSize(10)
     .fillColor('#4b5563')
     .font('Helvetica-Oblique')
     .text(notes, {
       width: doc.page.width - 100,
       align: 'left'
     });

  // Don't add moveDown here to prevent extra space before footer
}

/**
 * Draw footer with signature area and disclaimers
 */
function drawFooter(doc, doctor, appointment) {
  const pageHeight = doc.page.height;
  const pageMargin = 50;
  const footerHeight = 120; // Total height needed for footer content
  const signatureY = pageHeight - footerHeight;

  // Only move to footer position if there's enough space on current page
  // If content already extends past where footer should start, don't jump
  if (doc.y < signatureY) {
    doc.y = signatureY;
  }

  // Signature line - positioned on the right side
  const signatureLineY = doc.y;
  doc.strokeColor('#374151')
     .lineWidth(1)
     .moveTo(doc.page.width - 200, signatureLineY)
     .lineTo(doc.page.width - 50, signatureLineY)
     .stroke();

  // Doctor name under signature line
  doc.fontSize(10)
     .fillColor('#374151')
     .font('Helvetica')
     .text(`Dr. ${doctor?.firstName || ''} ${doctor?.lastName || ''}`, doc.page.width - 200, signatureLineY + 5, {
       width: 150,
       align: 'center'
     });

  // Doctor speciality
  if (doctor?.speciality) {
    doc.fontSize(9)
       .fillColor('#6b7280')
       .text(doctor.speciality, doc.page.width - 200, signatureLineY + 20, {
         width: 150,
         align: 'center'
       });
  }

  // Disclaimer at the very bottom - fixed position
  doc.fontSize(8)
     .fillColor('#9ca3af')
     .font('Helvetica')
     .text(
       'This prescription is digitally generated by CareSync Hospital Management System. Please follow the prescribed medication as directed by your doctor. In case of any adverse reactions, consult your doctor immediately.',
       pageMargin,
       pageHeight - 55,
       {
         width: doc.page.width - (pageMargin * 2),
         align: 'center',
         lineBreak: false
       }
     );

  // Generated timestamp - fixed position at bottom
  doc.fontSize(7)
     .fillColor('#d1d5db')
     .text(
       `Generated on: ${new Date().toLocaleString()}`,
       pageMargin,
       pageHeight - 30,
       {
         width: doc.page.width - (pageMargin * 2),
         align: 'center',
         lineBreak: false
       }
     );
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export default {
  generatePrescriptionPDF
};
