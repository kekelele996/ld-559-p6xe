import { BusinessException } from '../../exceptions/business.exception';

export const RENEWAL_MAX_GAP_DAYS = 30;

export function validatePolicyDates(startDate: string, endDate: string) {
  if (new Date(endDate) <= new Date(startDate)) throw new BusinessException('保单结束日期必须晚于开始日期');
}

export function validateRenewalWindow(previousEnd: Date, nextStart: Date) {
  if (nextStart.getTime() <= previousEnd.getTime()) {
    throw new BusinessException('新保障期不能与原保单重叠，开始日期必须晚于原保单结束日期');
  }
  const gapDays = (nextStart.getTime() - previousEnd.getTime()) / (1000 * 60 * 60 * 24);
  if (gapDays > RENEWAL_MAX_GAP_DAYS) {
    throw new BusinessException(`新旧保障期之间的空档不能超过 ${RENEWAL_MAX_GAP_DAYS} 天`);
  }
}
