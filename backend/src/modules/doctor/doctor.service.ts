import { prisma } from '../../config/prisma';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export class DoctorService {
  public async createPatient(doctorId: string, data: any) {
    const { email, firstName, lastName, phone, isPregnant, trimester } = data;
    const tempPassword = await bcrypt.hash('Patient@123', 10);

    return await prisma.$transaction(async (tx) => {
      // 1. Create Patient User (role = USER)
      const patient = await tx.user.create({
        data: {
          email,
          password: tempPassword,
          firstName,
          lastName,
          phone,
          role: Role.USER,
          isPregnant: isPregnant || false,
          trimester: trimester || null
        }
      });

      // 2. Link to Doctor via DoctorPatient table
      await tx.doctorPatient.create({
        data: { doctorId, patientId: patient.id }
      });

      return patient;
    });
  }

  public async createPrescription(doctorId: string, patientId: string, medicines: any[]) {
    return await prisma.$transaction(async (tx) => {
      // 1. Create Prescription
      const prescription = await tx.prescription.create({
        data: {
          doctorId,
          patientId,
          medicines: {
            create: medicines.map(m => ({
              medicineId: m.medicineId,
              dosage: m.dosage,
              refills: 0
            }))
          }
        }
      });

      // 2. Auto-Create Schedule entries for each medicine
      // Using today as start date
      for (const med of medicines) {
        await tx.schedule.create({
          data: {
            patientId,
            medicineId: med.medicineId,
            dosage: med.dosage,
            frequency: med.frequency || 'DAILY',
            timeOfDay: med.timeOfDay || '08:00',
            status: 'ACTIVE'
          }
        });
      }

      return prescription;
    });
  }

  public async getDoctorPatients(doctorId: string) {
    const mappings = await prisma.doctorPatient.findMany({
      where: { doctorId },
      include: { patient: true }
    });
    return mappings.map(m => m.patient);
  }
}
