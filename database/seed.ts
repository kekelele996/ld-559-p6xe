import { PrismaClient, Gender, InsuranceStatus, PetSpecies, PolicyType, RenewalStatus, UserRole, VaccineStatus, VisitType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('PetCare123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@petcare.test' },
    update: {},
    create: { email: 'owner@petcare.test', password, name: '林一一', role: UserRole.PET_OWNER },
  });
  const vet = await prisma.user.upsert({
    where: { email: 'vet@petcare.test' },
    update: {},
    create: { email: 'vet@petcare.test', password, name: '周医生', role: UserRole.VET },
  });
  await prisma.user.upsert({
    where: { email: 'admin@petcare.test' },
    update: {},
    create: { email: 'admin@petcare.test', password, name: '平台管理员', role: UserRole.ADMIN },
  });
  const clinic = await prisma.clinic.create({ data: { name: '安心宠物医院', address: '上海市徐汇区健康路 12 号', phone: '021-38506' } });
  const pet = await prisma.pet.create({
    data: {
      ownerId: owner.id,
      name: '豆包',
      species: PetSpecies.DOG,
      breed: '柯基',
      gender: Gender.MALE,
      birthDate: new Date('2021-03-12'),
      weight: 11.8,
      microchipNo: 'MC-559-001',
      allergies: '青霉素',
      medicalHistory: '幼年期肠胃敏感，需定期复查。',
    },
  });
  await prisma.medicalRecord.create({
    data: {
      petId: pet.id,
      vetId: vet.id,
      clinicId: clinic.id,
      visitDate: new Date(),
      type: VisitType.CHECKUP,
      diagnosis: '年度体检，体况良好',
      treatment: '建议控制体重并增加运动',
      prescription: '益生菌 7 日',
      cost: 328,
      nextVisitDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      attachments: [],
    },
  });
  await prisma.vaccineRecord.create({
    data: {
      petId: pet.id,
      vaccineName: '狂犬疫苗',
      batchNo: 'RV-2026-06',
      nextDueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6),
      vetId: vet.id,
      status: VaccineStatus.PENDING,
    },
  });
  // 上一段保单（已过期保留）→ 当前待续保单，演示续保前后关系
  const expiredPolicy = await prisma.insurancePolicy.create({
    data: {
      petId: pet.id,
      provider: 'PawShield',
      planType: PolicyType.STANDARD,
      premium: 1199,
      coverage: 30000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: InsuranceStatus.EXPIRED,
    },
  });
  const currentPolicy = await prisma.insurancePolicy.create({
    data: {
      petId: pet.id,
      provider: 'PawShield',
      planType: PolicyType.STANDARD,
      premium: 1299,
      coverage: 30000,
      startDate: new Date('2026-01-01'),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20),
      status: InsuranceStatus.PENDING_RENEWAL,
      renewedFromId: expiredPolicy.id,
    },
  });
  await prisma.policyRenewal.create({
    data: {
      policyId: expiredPolicy.id,
      petId: pet.id,
      startDate: currentPolicy.startDate,
      endDate: currentPolicy.endDate,
      premium: 1299,
      status: RenewalStatus.APPROVED,
      newPolicyId: currentPolicy.id,
      processedAt: new Date('2026-01-01'),
    },
  });
}

main().finally(async () => prisma.$disconnect());
