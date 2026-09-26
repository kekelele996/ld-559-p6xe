import { InsuranceStatus, PolicyType, RenewalStatus } from '../constants/enums';
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
  pet?: Pet;
}

export interface PolicyRenewal {
  id: string;
  policyId: string;
  petId: string;
  startDate: string;
  endDate: string;
  premium: number;
  status: RenewalStatus;
  newPolicyId?: string | null;
  processedAt?: string | null;
  createdAt: string;
  policy?: InsurancePolicy;
}
