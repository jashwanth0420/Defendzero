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

  // 5. Create Pharmacy
  const pharmacy = await prisma.user.upsert({
    where: { email: 'pharmacy@defendzero.com' },
    update: {},
    create: {
      email: 'pharmacy@defendzero.com',
      password,
      role: Role.PHARMACY,
      firstName: 'Apollo',
      lastName: 'MedPlus',
      storeName: 'Apollo MedPlus Shop #45'
    }
  });

  // 6. Create Guardian
  const guardian = await prisma.user.upsert({
    where: { email: 'guardian@defendzero.com' },
    update: {},
    create: {
      email: 'guardian@defendzero.com',
      password,
      role: Role.GUARDIAN,
      firstName: 'Jane',
      lastName: 'Doe'
    }
  });

  // 7. Link Guardian to Patient
  await prisma.guardianPatient.upsert({
    where: { guardianId_patientId: { guardianId: guardian.id, patientId: patient.id } },
    update: {},
    create: {
       guardianId: guardian.id,
       patientId: patient.id
    }
  });

  // 8. Create a VERIFIED Prescription Record (for Hex Token generation)
  const verifiedPrescription = await prisma.prescriptionRecord.upsert({
    where: { id: '77777777-7777-7777-7777-777777777777' }, // Fixed ID for easy testing
    update: {},
    create: {
      id: '77777777-7777-7777-7777-777777777777',
      userId: patient.id,
      doctorName: 'Dr. Gregory House',
      issuedDate: new Date(),
      verified: true,
      medicines: [
        { name: 'Amoxicillin', dosage: '250mg', frequency: 'DAILY' },
        { name: 'Paracetamol', dosage: '500mg', frequency: 'DAILY' }
      ]
    }
  });

  // 9. Create ADHERENCE SCHEDULES (Morning and Night)
  await prisma.schedule.createMany({
    skipDuplicates: true,
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
  console.log('Pharmacy: pharmacy@defendzero.com / password123');
  console.log('Guardian: guardian@defendzero.com / password123');
  console.log('-----------------');
  console.log('Use patient login to generate a QR Token from the verified prescription.');
  console.log('Use pharmacy login to LOAD and FULFILL the token.');
  console.log('Use guardian login to MONITOR the patient.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
