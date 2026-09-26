import { InsuranceStatus, PolicyType } from '../constants/enums';
import { Pet } from './pet';

export interface InsurancePolicy {
  id: string;
  petId: string;
  provider: string;
  planType: PolicyType;
  premium: number;
  coverage: number;
  startDate: string;
  endDate: string;
  status: InsuranceStatus;
  renewedFromId?: string | null;
  renewedFrom?: InsurancePolicy | null;
  renewals?: InsurancePolicy[];
  pet?: Pet;
}

export interface RenewInsurancePayload {
  startDate: string;
  endDate: string;
  premium: number;
  coverage?: number;
}
