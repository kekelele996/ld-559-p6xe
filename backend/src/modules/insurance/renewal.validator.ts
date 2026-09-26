import { BusinessException } from '../../exceptions/business.exception';

export const MAX_RENEWAL_GAP_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

function dayOnly(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * 续保保障期校验（按自然日、起止日均视为覆盖当日）：
 * 1. 新保障期不能与原保单重叠；
 * 2. 新保障期必须衔接原保单结束日期或在其之后，两段之间最多空 30 天。
 */
export function validateRenewalWindow(
  policy: { startDate: Date; endDate: Date },
  startDate: string,
  endDate: string,
) {
  const start = dayOnly(new Date(startDate));
  const end = dayOnly(new Date(endDate));
  if (end <= start) throw new BusinessException('保单结束日期必须晚于开始日期');

  const oldStart = dayOnly(policy.startDate);
  const oldEnd = dayOnly(policy.endDate);
  if (start <= oldEnd && end >= oldStart) {
    throw new BusinessException('新保障期不能与原保单保障期重叠');
  }
  const gapDays = Math.round((start - oldEnd) / DAY_MS) - 1;
  if (gapDays < 0) throw new BusinessException('新保障期必须衔接原保单结束日期或在其之后');
  if (gapDays > MAX_RENEWAL_GAP_DAYS) {
    throw new BusinessException(`新旧保障期之间最多空 ${MAX_RENEWAL_GAP_DAYS} 天`);
  }
}
