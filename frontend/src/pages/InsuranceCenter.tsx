import { useState } from 'react';
import { Card, Col, Row, Space, Steps, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { insuranceApi } from '../api/insuranceApi';
import type { CreateRenewalPayload } from '../api/insuranceApi';
import { InsurancePieChart } from '../components/charts/InsurancePieChart';
import { PolicyCard } from '../components/insurance/PolicyCard';
import { RenewalList } from '../components/insurance/RenewalList';
import { RenewalModal } from '../components/insurance/RenewalModal';
import { RenewalStatus } from '../constants/enums';
import type { InsurancePolicy } from '../types/insurance';

export default function InsuranceCenter() {
  const queryClient = useQueryClient();
  const { data: policies = [] } = useQuery({ queryKey: ['insurance'], queryFn: () => insuranceApi.list() });
  const { data: renewals = [] } = useQuery({ queryKey: ['renewals'], queryFn: () => insuranceApi.renewals() });
  const [renewTarget, setRenewTarget] = useState<InsurancePolicy | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['insurance'] });
    queryClient.invalidateQueries({ queryKey: ['renewals'] });
  };

  const renewMutation = useMutation({
    mutationFn: (payload: CreateRenewalPayload) => insuranceApi.createRenewal(payload),
    onSuccess: () => {
      message.success('续保申请已提交，请等待处理');
      setRenewTarget(null);
      refresh();
    },
  });
  const processMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      approve ? insuranceApi.approveRenewal(id) : insuranceApi.rejectRenewal(id),
    onSuccess: (_res, vars) => {
      message.success(vars.approve ? '续保已通过，新保单按新日期生效' : '续保申请已驳回');
      refresh();
    },
  });
  const claimMutation = useMutation({
    mutationFn: (id: string) => insuranceApi.claim(id),
    onSuccess: () => {
      message.success('理赔申请已提交');
      refresh();
    },
  });

  const policyById = new Map(policies.map((policy) => [policy.id, policy]));
  const nextBySourceId = new Map(
    policies.filter((policy) => policy.renewedFromId).map((policy) => [policy.renewedFromId as string, policy]),
  );
  const pendingByPolicyId = new Map(
    renewals.filter((renewal) => renewal.status === RenewalStatus.PENDING).map((renewal) => [renewal.policyId, renewal]),
  );

  return (
    <Space direction="vertical" size={20} className="page-block">
      <Typography.Title level={2}>保险中心</Typography.Title>
      <Row gutter={[16, 16]}>
        {policies.map((policy) => (
          <Col xs={24} lg={12} key={policy.id}>
            <PolicyCard
              policy={policy}
              previous={policy.renewedFromId ? policyById.get(policy.renewedFromId) : undefined}
              next={nextBySourceId.get(policy.id)}
              pendingRenewal={pendingByPolicyId.get(policy.id)}
              onRenew={setRenewTarget}
              onClaim={(target) => claimMutation.mutate(target.id)}
            />
          </Col>
        ))}
      </Row>
      <Card title="续保申请">
        <RenewalList
          renewals={renewals}
          processing={processMutation.isPending}
          onProcess={(id, approve) => processMutation.mutate({ id, approve })}
        />
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}><Card title="理赔进度"><Steps current={1} items={[{ title: '提交' }, { title: '审核' }, { title: '赔付' }]} /></Card></Col>
        <Col xs={24} lg={12}><Card title="年度保费分析"><InsurancePieChart policies={policies} /></Card></Col>
      </Row>
      <RenewalModal
        policy={renewTarget}
        loading={renewMutation.isPending}
        onCancel={() => setRenewTarget(null)}
        onSubmit={(payload) => renewMutation.mutate(payload)}
      />
    </Space>
  );
}
