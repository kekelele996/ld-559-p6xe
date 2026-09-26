import { request, unwrap } from '../utils/request';
import type { InsurancePolicy, PolicyRenewal } from '../types/insurance';
import { mockInsurance, mockRenewals } from '../utils/mockData';

export interface CreateRenewalPayload {
  policyId: string;
  startDate: string;
  endDate: string;
  premium: number;
}

export const insuranceApi = {
  list: (params?: { petId?: string }) => unwrap<InsurancePolicy[]>(request.get('/insurance', { params }), mockInsurance),
  claim: (id: string) => request.patch(`/insurance/${id}/claim`),
  renewals: (params?: { policyId?: string }) => unwrap<PolicyRenewal[]>(request.get('/insurance/renewals', { params }), mockRenewals),
  createRenewal: (data: CreateRenewalPayload) => request.post('/insurance/renewals', data),
  approveRenewal: (id: string) => request.patch(`/insurance/renewals/${id}/approve`),
  rejectRenewal: (id: string) => request.patch(`/insurance/renewals/${id}/reject`),
};
