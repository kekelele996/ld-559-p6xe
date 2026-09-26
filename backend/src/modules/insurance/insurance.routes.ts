export const insuranceRoutes = {
  list: 'GET /api/v1/insurance',
  create: 'POST /api/v1/insurance',
  renewals: 'GET /api/v1/insurance/renewals',
  createRenewal: 'POST /api/v1/insurance/renewals',
  approveRenewal: 'PATCH /api/v1/insurance/renewals/:id/approve',
  rejectRenewal: 'PATCH /api/v1/insurance/renewals/:id/reject',
  claim: 'PATCH /api/v1/insurance/:id/claim',
  update: 'PATCH /api/v1/insurance/:id',
} as const;
