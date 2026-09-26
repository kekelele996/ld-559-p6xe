import { Injectable } from '@nestjs/common';
import { InsuranceStatus, UserRole } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { CreateInsuranceDto, RenewInsuranceDto, UpdateInsuranceDto } from './insurance.dto';
import { InsuranceRepository } from './insurance.repository';
import { validatePolicyDates, validateRenewalWindow } from './insurance.validator';

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

  async renew(id: string, dto: RenewInsuranceDto) {
    const policy = await this.repo.findById(id);
    if (!policy) throw new BusinessException('保单不存在');

    const pending = await this.repo.findPendingRenewal(id);
    if (pending) throw new BusinessException('该保单已有待处理的续保申请，请先处理原申请');

    validatePolicyDates(dto.startDate, dto.endDate);
    const startDate = new Date(dto.startDate);
    validateRenewalWindow(policy.endDate, startDate);

    const status = startDate.getTime() > Date.now() ? InsuranceStatus.PENDING_RENEWAL : InsuranceStatus.ACTIVE;
    return this.repo.create({
      petId: policy.petId,
      provider: policy.provider,
      planType: policy.planType,
      premium: dto.premium,
      coverage: dto.coverage ?? Number(policy.coverage),
      startDate,
      endDate: new Date(dto.endDate),
      status,
      renewedFromId: policy.id,
    });
  }
}
