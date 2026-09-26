import { request, unwrap } from '../utils/request';
import type { InsurancePolicy, RenewInsurancePayload } from '../types/insurance';
import { mockInsurance } from '../utils/mockData';

export const insuranceApi = {
  list: (params?: { petId?: string }) => unwrap<InsurancePolicy[]>(request.get('/insurance', { params }), mockInsurance),
  claim: (id: string) => request.patch(`/insurance/${id}/claim`),
  renew: (id: string, payload: RenewInsurancePayload) => request.post(`/insurance/${id}/renew`, payload),
};
