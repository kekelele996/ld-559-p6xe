import { Button, Popconfirm, Space, Table, Typography } from 'antd';
import { RenewalStatus } from '../../constants/enums';
import type { PolicyRenewal } from '../../types/insurance';
import { formatCurrency, formatDate } from '../../utils/format';
import { StatusBadge } from '../common/StatusBadge';

interface RenewalListProps {
  renewals: PolicyRenewal[];
  processing: boolean;
  onProcess: (id: string, approve: boolean) => void;
}

export function RenewalList({ renewals, processing, onProcess }: RenewalListProps) {
  return (
    <Table<PolicyRenewal>
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={renewals}
      columns={[
        {
          title: '保单',
          key: 'policy',
          render: (_, record) => (
            <Space size={4}>
              <Typography.Text strong>{record.policy?.provider || '-'}</Typography.Text>
              <Typography.Text type="secondary">{record.policy?.pet?.name}</Typography.Text>
            </Space>
          ),
        },
        {
          title: '原保障期',
          key: 'oldPeriod',
          render: (_, record) =>
            record.policy ? `${formatDate(record.policy.startDate)} 至 ${formatDate(record.policy.endDate)}` : '-',
        },
        {
          title: '新保障期',
          key: 'newPeriod',
          render: (_, record) => `${formatDate(record.startDate)} 至 ${formatDate(record.endDate)}`,
        },
        { title: '新保费', key: 'premium', render: (_, record) => formatCurrency(record.premium) },
        { title: '申请时间', key: 'createdAt', render: (_, record) => formatDate(record.createdAt) },
        { title: '状态', key: 'status', render: (_, record) => <StatusBadge status={record.status} kind="renewal" /> },
        {
          title: '操作',
          key: 'actions',
          render: (_, record) =>
            record.status === RenewalStatus.PENDING ? (
              <Space>
                <Popconfirm title="通过后新保单将按新日期生效" onConfirm={() => onProcess(record.id, true)}>
                  <Button type="link" size="small" disabled={processing}>通过</Button>
                </Popconfirm>
                <Popconfirm title="驳回后原保单仍为待续状态" onConfirm={() => onProcess(record.id, false)}>
                  <Button type="link" size="small" danger disabled={processing}>驳回</Button>
                </Popconfirm>
              </Space>
            ) : (
              <Typography.Text type="secondary">已处理</Typography.Text>
            ),
        },
      ]}
    />
  );
}
