import { useState } from 'react';
import { Button, Card, Col, Row, Space, Steps, Tooltip, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { insuranceApi } from '../api/insuranceApi';
import { InsurancePieChart } from '../components/charts/InsurancePieChart';
import { StatusBadge } from '../components/common/StatusBadge';
import { RenewPolicyModal } from '../components/insurance/RenewPolicyModal';
import { InsuranceStatus, enumLabels } from '../constants/enums';
import type { InsurancePolicy } from '../types/insurance';
import { formatCurrency, formatDate } from '../utils/format';

const RENEWABLE_STATUS: InsuranceStatus[] = [InsuranceStatus.PENDING_RENEWAL, InsuranceStatus.EXPIRED];

function latestRenewal(policy: InsurancePolicy) {
  return policy.renewals?.slice().sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
}

export default function InsuranceCenter() {
  const { data = [] } = useQuery({ queryKey: ['insurance'], queryFn: () => insuranceApi.list() });
  const [renewTarget, setRenewTarget] = useState<InsurancePolicy | null>(null);

  const renderActions = (policy: InsurancePolicy) => {
    const actions = [<Button key="claim" type="link">提交理赔</Button>];
    if (RENEWABLE_STATUS.includes(policy.status)) {
      const pending = latestRenewal(policy);
      const hasPending = pending?.status === InsuranceStatus.PENDING_RENEWAL;
      actions.push(
        hasPending ? (
          <Tooltip key="renew" title="已有待处理的续保申请，请先处理原申请">
            <Button type="link" disabled>续保审核中</Button>
          </Tooltip>
        ) : (
          <Button key="renew" type="link" onClick={() => setRenewTarget(policy)}>发起续保</Button>
        ),
      );
    }
    return actions;
  };

  return (
    <Space direction="vertical" size={20} className="page-block">
      <Typography.Title level={2}>保险中心</Typography.Title>
      <Row gutter={[16, 16]}>
        {data.map((policy) => {
          const next = latestRenewal(policy);
          return (
            <Col xs={24} lg={12} key={policy.id}>
              <Card actions={renderActions(policy)}>
                <Space direction="vertical">
                  <Space><Typography.Title level={4}>{policy.provider}</Typography.Title><StatusBadge status={policy.status} /></Space>
                  <Typography.Text>{policy.pet?.name} · {enumLabels[policy.planType]}计划</Typography.Text>
                  <Typography.Text>保费 {formatCurrency(policy.premium)}，保障 {formatCurrency(policy.coverage)}</Typography.Text>
                  <Typography.Text type="secondary">{formatDate(policy.startDate)} 至 {formatDate(policy.endDate)}</Typography.Text>
                  {policy.renewedFrom && (
                    <Typography.Text type="secondary">
                      续保自旧保单 {formatDate(policy.renewedFrom.startDate)} 至 {formatDate(policy.renewedFrom.endDate)}
                    </Typography.Text>
                  )}
                  {next && (
                    <Typography.Text type="secondary">
                      已续保：新保障期 {formatDate(next.startDate)} 至 {formatDate(next.endDate)}
                    </Typography.Text>
                  )}
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}><Card title="理赔进度"><Steps current={1} items={[{ title: '提交' }, { title: '审核' }, { title: '赔付' }]} /></Card></Col>
        <Col xs={24} lg={12}><Card title="年度保费分析"><InsurancePieChart policies={data} /></Card></Col>
      </Row>
      <RenewPolicyModal policy={renewTarget} onClose={() => setRenewTarget(null)} />
    </Space>
  );
}
