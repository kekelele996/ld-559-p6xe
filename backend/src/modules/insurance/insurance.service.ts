import { Injectable } from '@nestjs/common';
import { InsuranceStatus, RenewalStatus, UserRole } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { CreateInsuranceDto, UpdateInsuranceDto } from './insurance.dto';
import { CreateRenewalDto } from './renewal.dto';
import { InsuranceRepository } from './insurance.repository';
import { validatePolicyDates } from './insurance.validator';
import { validateRenewalWindow } from './renewal.validator';

@Injectable()
export class InsuranceService {
  constructor(private readonly repo: InsuranceRepository) {}

  list(user: { sub: string; role: UserRole }, petId?: string) {
    return this.repo.findMany(user, petId);
  }

  create(dto: CreateInsuranceDto) {
    validatePolicyDates(dto.startDate, dto.endDate);
    return this.repo.create({ ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) });
  }

  claim(id: string) {
    return this.repo.update(id, { status: InsuranceStatus.CLAIMING });
  }

  update(id: string, dto: UpdateInsuranceDto) {
    validatePolicyDates(dto.startDate, dto.endDate);
    return this.repo.update(id, { ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) });
  }

  listRenewals(user: { sub: string; role: UserRole }, policyId?: string) {
    return this.repo.findRenewals(user, policyId);
  }

  /** 从待续保单发起续保申请，生成独立续保记录，旧保单保持不变 */
  async createRenewal(user: { sub: string; role: UserRole }, dto: CreateRenewalDto) {
    const policy = await this.repo.findById(dto.policyId);
    if (!policy) throw new BusinessException('保单不存在', 40401);
    if (user.role === UserRole.PET_OWNER && policy.pet.ownerId !== user.sub) {
      throw new BusinessException('只能为自己的保单发起续保', 40301);
    }
    if (policy.status !== InsuranceStatus.PENDING_RENEWAL) {
      throw new BusinessException('仅待续状态的保单可以发起续保');
    }
    validateRenewalWindow(policy, dto.startDate, dto.endDate);
    const pending = await this.repo.findPendingRenewal(policy.id);
    if (pending) throw new BusinessException('该保单已有待处理的续保申请，请先处理原申请');
    return this.repo.createRenewal({
      policyId: policy.id,
      petId: policy.petId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      premium: dto.premium,
    });
  }

  /** 处理续保申请：通过后新保单按新日期生效，旧保单置为已过期保留历史 */
  async processRenewal(id: string, approve: boolean) {
    const renewal = await this.repo.findRenewalById(id);
    if (!renewal) throw new BusinessException('续保申请不存在', 40401);
    if (renewal.status !== RenewalStatus.PENDING) {
      throw new BusinessException('该续保申请已处理，请勿重复操作');
    }
    if (!approve) return this.repo.rejectRenewal(id);
    const policy = await this.repo.approveRenewal(renewal);
    return { renewalId: renewal.id, policy };
  }
}
