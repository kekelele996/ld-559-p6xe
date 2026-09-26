import { DatePicker, Form, InputNumber, Modal, Typography, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { insuranceApi } from '../../api/insuranceApi';
import type { InsurancePolicy, RenewInsurancePayload } from '../../types/insurance';
import { formatDate } from '../../utils/format';

const MAX_GAP_DAYS = 30;

interface RenewPolicyModalProps {
  policy: InsurancePolicy | null;
  onClose: () => void;
}

interface RenewFormValues {
  startDate: Dayjs;
  endDate: Dayjs;
  premium: number;
  coverage?: number;
}

export function RenewPolicyModal({ policy, onClose }: RenewPolicyModalProps) {
  const [form] = Form.useForm<RenewFormValues>();
  const client = useQueryClient();
  const renew = useMutation({
    mutationFn: (payload: RenewInsurancePayload) => insuranceApi.renew(policy!.id, payload),
    onSuccess: () => {
      message.success('续保成功，已生成新的保单记录，原保单保留可查');
      client.invalidateQueries({ queryKey: ['insurance'] });
      onClose();
    },
  });

  if (!policy) return null;
  const previousEnd = dayjs(policy.endDate);

  const disabledStartDate = (current: Dayjs) =>
    current.isBefore(previousEnd.add(1, 'day'), 'day') || current.isAfter(previousEnd.add(MAX_GAP_DAYS, 'day'), 'day');

  const submit = async () => {
    const values = await form.validateFields();
    renew.mutate({
      startDate: values.startDate.format('YYYY-MM-DD'),
      endDate: values.endDate.format('YYYY-MM-DD'),
      premium: values.premium,
      coverage: values.coverage,
    });
  };

  return (
    <Modal
      title={`续保 · ${policy.provider}`}
      open
      onOk={submit}
      onCancel={onClose}
      confirmLoading={renew.isPending}
      okText="提交续保"
      cancelText="取消"
      destroyOnClose
    >
      <Typography.Paragraph type="secondary">
        原保单保障期 {formatDate(policy.startDate)} 至 {formatDate(policy.endDate)}。
        新保障期不能与原保单重叠，两段之间最多空 {MAX_GAP_DAYS} 天；续保将生成一条新记录，原保单继续保留。
      </Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          startDate: previousEnd.add(1, 'day'),
          endDate: previousEnd.add(1, 'year'),
          premium: Number(policy.premium),
          coverage: Number(policy.coverage),
        }}
      >
        <Form.Item name="startDate" label="新保障开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
          <DatePicker style={{ width: '100%' }} disabledDate={disabledStartDate} />
        </Form.Item>
        <Form.Item name="endDate" label="新保障结束日期" rules={[{ required: true, message: '请选择结束日期' }]}>
          <DatePicker style={{ width: '100%' }} disabledDate={(current) => current.isBefore(previousEnd.add(1, 'day'), 'day')} />
        </Form.Item>
        <Form.Item name="premium" label="续保保费（元）" rules={[{ required: true, message: '请输入保费' }]}>
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        <Form.Item name="coverage" label="保障额度（元）">
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
