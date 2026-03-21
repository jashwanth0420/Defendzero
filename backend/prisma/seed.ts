import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // 1. Create Doctor
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@defendzero.com' },
    update: {},
    create: {
      email: 'doctor@defendzero.com',
      password,
      role: Role.DOCTOR,
      firstName: 'Gregory',
      lastName: 'House',
      licenseNumber: 'DOC-123',
      specialization: 'Diagnostic Medicine'
    }
  });

  // 2. Create Patient
  const patient = await prisma.user.upsert({
    where: { email: 'patient@defendzero.com' },
    update: {},
    create: {
      email: 'patient@defendzero.com',
      password,
      role: Role.USER,
      firstName: 'John',
      lastName: 'Doe',
      isPregnant: false
    }
  });

  // 3. Link Doctor to Patient via Mapping Table
  await prisma.doctorPatient.upsert({
    where: { doctorId_patientId: { doctorId: doctor.id, patientId: patient.id } },
    update: {},
    create: {
       doctorId: doctor.id,
       patientId: patient.id
    }
  });

  // 4. Create Medicines in Catalog
  const paracetamol = await prisma.medicine.upsert({
    where: { name: 'Paracetamol' },
    update: {},
    create: {
      name: 'Paracetamol',
      description: 'Standard pain reliever and fever reducer.',
      requiresToken: false
    }
  });

  const amoxicillin = await prisma.medicine.upsert({
    where: { name: 'Amoxicillin' },
    update: {},
    create: {
      name: 'Amoxicillin',
      description: 'Common penicillin-type antibiotic.',
      requiresToken: true
    }
  });

  // 5. Create Prescription
  const prescription = await prisma.prescription.create({
    data: {
      doctorId: doctor.id,
      patientId: patient.id,
      notes: 'Take medicines as scheduled.',
      medicines: {
        create: [
          { medicineId: paracetamol.id, dosage: '500mg' },
          { medicineId: amoxicillin.id, dosage: '250mg' }
        ]
      }
    }
  });

  // 6. Create ADHERENCE SCHEDULES (Morning and Night)
  await prisma.schedule.createMany({
    data: [
      {
        patientId: patient.id,
        medicineId: paracetamol.id,
        dosage: '500mg',
        frequency: 'DAILY',
        timeOfDay: '08:00', // Morning
        status: 'ACTIVE'
      },
      {
        patientId: patient.id,
        medicineId: paracetamol.id,
        dosage: '500mg',
        frequency: 'DAILY',
        timeOfDay: '20:00', // Night
        status: 'ACTIVE'
      },
      {
        patientId: patient.id,
        medicineId: amoxicillin.id,
        dosage: '250mg',
        frequency: 'DAILY',
        timeOfDay: '09:00', // Morning
        status: 'ACTIVE'
      }
    ]
  });

  console.log('Seed completed successfully!');
  console.log('--- TEST DATA ---');
  console.log('Doctor: doctor@defendzero.com / password123');
  console.log('Patient: patient@defendzero.com / password123');
  console.log('Medicines: Paracetamol, Amoxicillin');
  console.log('Schedules: Morning (08:00, 09:00) and Night (20:00) for Patient John Doe');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
