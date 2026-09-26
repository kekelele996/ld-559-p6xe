import { useEffect } from 'react';
import { DatePicker, Descriptions, Form, InputNumber, Modal, Typography, message } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { CreateRenewalPayload } from '../../api/insuranceApi';
import type { InsurancePolicy } from '../../types/insurance';
import { formatCurrency, formatDate } from '../../utils/format';

const MAX_GAP_DAYS = 30;

interface RenewalFormValues {
  range: [Dayjs, Dayjs];
  premium: number;
}

interface RenewalModalProps {
  policy: InsurancePolicy | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateRenewalPayload) => void;
}

export function RenewalModal({ policy, loading, onCancel, onSubmit }: RenewalModalProps) {
  const [form] = Form.useForm<RenewalFormValues>();

  useEffect(() => {
    if (policy) {
      const oldEnd = dayjs(policy.endDate);
      form.setFieldsValue({
        range: [oldEnd.add(1, 'day'), oldEnd.add(1, 'year')],
        premium: policy.premium,
      });
    }
  }, [policy, form]);

  const handleOk = async () => {
    if (!policy) return;
    const values = await form.validateFields();
    const start = values.range[0].startOf('day');
    const end = values.range[1].startOf('day');
    const oldStart = dayjs(policy.startDate).startOf('day');
    const oldEnd = dayjs(policy.endDate).startOf('day');
    if (!end.isAfter(start)) {
      message.error('结束日期必须晚于开始日期');
      return;
    }
    if (!start.isAfter(oldEnd) && !end.isBefore(oldStart)) {
      message.error('新保障期不能与原保单保障期重叠');
      return;
    }
    const gapDays = start.diff(oldEnd, 'day') - 1;
    if (gapDays < 0) {
      message.error('新保障期必须衔接原保单结束日期或在其之后');
      return;
    }
    if (gapDays > MAX_GAP_DAYS) {
      message.error(`新旧保障期之间最多空 ${MAX_GAP_DAYS} 天`);
      return;
    }
    onSubmit({
      policyId: policy.id,
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      premium: values.premium,
    });
  };

  return (
    <Modal
      title="发起续保"
      open={Boolean(policy)}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={onCancel}
      okText="提交续保申请"
      cancelText="取消"
      destroyOnClose
    >
      {policy && (
        <>
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="保险公司">{policy.provider}</Descriptions.Item>
            <Descriptions.Item label="原保障期">{formatDate(policy.startDate)} 至 {formatDate(policy.endDate)}</Descriptions.Item>
            <Descriptions.Item label="原保费">{formatCurrency(policy.premium)}</Descriptions.Item>
          </Descriptions>
          <Typography.Text type="secondary">
            新保障期不能与原保单重叠，两段之间最多空 {MAX_GAP_DAYS} 天；旧保单将保留为历史记录。
          </Typography.Text>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item name="range" label="新保障期" rules={[{ required: true, message: '请选择新的起止日期' }]}>
              <DatePicker.RangePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="premium" label="新保费（元）" rules={[{ required: true, message: '请输入新保费' }]}>
              <InputNumber min={0.01} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}
