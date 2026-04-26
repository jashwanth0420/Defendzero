import { prisma } from '../../config/prisma';

export class GuardianService {
  public async addMapping(guardianId: string, patientId: string) {
    const guardian = await prisma.user.findUnique({ where: { id: guardianId } });
    const patient = await prisma.user.findUnique({ where: { id: patientId } });

    if (!guardian || !patient) {
      throw new Error('Guardian or Patient not found');
    }

    if (guardian.role !== 'GUARDIAN') {
      throw new Error('User is not a guardian');
    }

    const mapping = await prisma.guardianPatient.create({
      data: { guardianId, patientId }
    });

    return mapping;
  }

  public async getPatients(guardianId: string) {
    const patients = await prisma.guardianPatient.findMany({
      where: { guardianId },
      include: { patient: true }
    });

    if (!patients.length) {
      throw new Error('No patients found for this guardian.');
    }

    return patients.map(p => p.patient);
  }

  public async getGuardians(patientId: string) {
    const guardians = await prisma.guardianPatient.findMany({
      where: { patientId },
      include: { guardian: true }
    });

    if (!guardians.length) {
      throw new Error('No guardians found for this patient.');
    }

    return guardians.map(g => g.guardian);
  }
  public async getPatientFullStory(guardianId: string, patientId: string) {
    const mapping = await prisma.guardianPatient.findFirst({
      where: { guardianId, patientId }
    });
    if (!mapping) throw new Error('You do not guard this patient.');

    const { MedicationService } = await import('../medication/medication.service');
    const medService = new MedicationService();

    const [schedules, history] = await Promise.all([
      medService.getSchedules(patientId),
      medService.getHistory(patientId)
    ]);

    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { firstName: true, lastName: true, email: true }
    });

    return { patient, schedules, history };
  }
}
