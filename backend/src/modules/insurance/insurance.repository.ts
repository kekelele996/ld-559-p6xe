import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { InsurancePolicy, PolicyRenewal } from '@prisma/client';
import { InsuranceStatus, RenewalStatus, UserRole } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InsuranceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(user: { sub: string; role: UserRole }, petId?: string) {
    const where: Prisma.InsurancePolicyWhereInput = {
      ...(user.role === UserRole.PET_OWNER ? { pet: { ownerId: user.sub } } : {}),
      ...(petId ? { petId } : {}),
    };
    return this.prisma.insurancePolicy.findMany({ where, include: { pet: true }, orderBy: { endDate: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.insurancePolicy.findUnique({ where: { id }, include: { pet: true } });
  }

  create(data: Prisma.InsurancePolicyUncheckedCreateInput) {
    return this.prisma.insurancePolicy.create({ data });
  }

  update(id: string, data: Prisma.InsurancePolicyUncheckedUpdateInput) {
    return this.prisma.insurancePolicy.update({ where: { id }, data });
  }

  findRenewals(user: { sub: string; role: UserRole }, policyId?: string) {
    const where: Prisma.PolicyRenewalWhereInput = {
      ...(user.role === UserRole.PET_OWNER ? { pet: { ownerId: user.sub } } : {}),
      ...(policyId ? { policyId } : {}),
    };
    return this.prisma.policyRenewal.findMany({
      where,
      include: { policy: { include: { pet: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findRenewalById(id: string) {
    return this.prisma.policyRenewal.findUnique({ where: { id }, include: { policy: true } });
  }

  findPendingRenewal(policyId: string) {
    return this.prisma.policyRenewal.findFirst({ where: { policyId, status: RenewalStatus.PENDING } });
  }

  createRenewal(data: Prisma.PolicyRenewalUncheckedCreateInput) {
    return this.prisma.policyRenewal.create({ data });
  }

  rejectRenewal(id: string) {
    return this.prisma.policyRenewal.update({
      where: { id },
      data: { status: RenewalStatus.REJECTED, processedAt: new Date() },
    });
  }

  /** 通过续保：事务内生成新保单（关联旧保单）、旧保单置为已过期保留、申请标记已通过 */
  approveRenewal(renewal: PolicyRenewal & { policy: InsurancePolicy }) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.policyRenewal.updateMany({
        where: { id: renewal.id, status: RenewalStatus.PENDING },
        data: { status: RenewalStatus.APPROVED, processedAt: new Date() },
      });
      if (!claimed.count) throw new BusinessException('该续保申请已处理，请勿重复操作');
      const policy = await tx.insurancePolicy.create({
        data: {
          petId: renewal.policy.petId,
          provider: renewal.policy.provider,
          planType: renewal.policy.planType,
          premium: renewal.premium,
          coverage: renewal.policy.coverage,
          startDate: renewal.startDate,
          endDate: renewal.endDate,
          status: InsuranceStatus.ACTIVE,
          renewedFromId: renewal.policyId,
        },
      });
      await tx.insurancePolicy.update({
        where: { id: renewal.policyId },
        data: { status: InsuranceStatus.EXPIRED },
      });
      await tx.policyRenewal.update({ where: { id: renewal.id }, data: { newPolicyId: policy.id } });
      return policy;
    });
  }
}
