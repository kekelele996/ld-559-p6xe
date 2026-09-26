import { Tag } from 'antd';
import { InsuranceStatus, RenewalStatus, VaccineStatus, enumLabels, renewalStatusLabels } from '../../constants/enums';

type Status = VaccineStatus | InsuranceStatus | RenewalStatus | string;

const colors: Record<string, string> = {
  [VaccineStatus.COMPLETED]: 'green',
  [VaccineStatus.PENDING]: 'gold',
  [VaccineStatus.OVERDUE]: 'red',
  [InsuranceStatus.ACTIVE]: 'green',
  [InsuranceStatus.PENDING_RENEWAL]: 'orange',
  [InsuranceStatus.EXPIRED]: 'red',
  [InsuranceStatus.CLAIMING]: 'blue',
};

const renewalColors: Record<string, string> = {
  [RenewalStatus.PENDING]: 'gold',
  [RenewalStatus.APPROVED]: 'green',
  [RenewalStatus.REJECTED]: 'red',
};

export function StatusBadge({ status, kind }: { status: Status; kind?: 'renewal' }) {
  if (kind === 'renewal') {
    return <Tag color={renewalColors[status] || 'default'}>{renewalStatusLabels[status as RenewalStatus] || status}</Tag>;
  }
  return <Tag color={colors[status] || 'default'}>{enumLabels[status as keyof typeof enumLabels] || status}</Tag>;
}
