import { Button, Card, Space, Tag, Tooltip, Typography } from 'antd';
import { InsuranceStatus, enumLabels } from '../../constants/enums';
import type { InsurancePolicy, PolicyRenewal } from '../../types/insurance';
import { formatCurrency, formatDate } from '../../utils/format';
import { StatusBadge } from '../common/StatusBadge';

interface PolicyCardProps {
  policy: InsurancePolicy;
  previous?: InsurancePolicy;
  next?: InsurancePolicy;
  pendingRenewal?: PolicyRenewal;
  onRenew: (policy: InsurancePolicy) => void;
  onClaim: (policy: InsurancePolicy) => void;
}

export function PolicyCard({ policy, previous, next, pendingRenewal, onRenew, onClaim }: PolicyCardProps) {
  const renewable = policy.status === InsuranceStatus.PENDING_RENEWAL;
  const actions = [
    <Button key="claim" type="link" onClick={() => onClaim(policy)}>提交理赔</Button>,
  ];
  if (renewable) {
    actions.push(
      pendingRenewal ? (
        <Tooltip key="renew" title="已有待处理的续保申请，请先处理原申请">
          <Button type="link" disabled>续保处理中</Button>
        </Tooltip>
      ) : (
        <Button key="renew" type="link" onClick={() => onRenew(policy)}>发起续保</Button>
      ),
    );
  }
  return (
    <Card actions={actions}>
      <Space direction="vertical" size={4}>
        <Space>
          <Typography.Title level={4}>{policy.provider}</Typography.Title>
          <StatusBadge status={policy.status} />
          {policy.renewedFromId && <Tag color="teal">续保保单</Tag>}
        </Space>
        <Typography.Text>{policy.pet?.name} · {enumLabels[policy.planType]}计划</Typography.Text>
        <Typography.Text>保费 {formatCurrency(policy.premium)}，保障 {formatCurrency(policy.coverage)}</Typography.Text>
        <Typography.Text type="secondary">保障期 {formatDate(policy.startDate)} 至 {formatDate(policy.endDate)}</Typography.Text>
        {previous && (
          <Typography.Text type="secondary">
            由上期保单续保（{formatDate(previous.startDate)} 至 {formatDate(previous.endDate)}）
          </Typography.Text>
        )}
        {next && (
          <Typography.Text type="secondary">
            已续保，新保障期 {formatDate(next.startDate)} 至 {formatDate(next.endDate)}
          </Typography.Text>
        )}
        {pendingRenewal && (
          <Typography.Text type="warning">
            续保申请待处理：{formatDate(pendingRenewal.startDate)} 至 {formatDate(pendingRenewal.endDate)}，保费 {formatCurrency(pendingRenewal.premium)}
          </Typography.Text>
        )}
      </Space>
    </Card>
  );
}
