import { useState } from 'react';
import {
  Table, Tag, Input, Select, Button, Drawer, Row, Col, Card,
  Progress, Modal, message, Tooltip, Tabs, Form, InputNumber, Alert,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, ReloadOutlined,
  PlayCircleOutlined, PauseCircleOutlined, SyncOutlined,
  PlusOutlined, VideoCameraOutlined, ThunderboltOutlined,
  EnvironmentOutlined, ToolOutlined,
  CheckCircleOutlined, WarningOutlined,
} from '@ant-design/icons';
import { mockDevices } from '../../mock/data';
import type { Device } from '../../mock/data';
import type { ColumnType } from 'antd/es/table';

const { Option } = Select;

const statusConfig: Record<string, { color: string; dot: string }> = {
  '在线': { color: 'success', dot: '#00ff88' },
  '离线': { color: 'default', dot: '#4a5568' },
  '维护': { color: 'warning', dot: '#ffb800' },
  '告警': { color: 'error', dot: '#ff4d4d' },
};

const typeColors: Record<string, string> = {
  '光伏电站': '#ffb800',
  '储能系统': '#00d4ff',
  '风电': '#00ff88',
  '充电桩': '#a78bfa',
  '工业负荷': '#fb923c',
  '电网储能': '#38bdf8',
};

const BATTERY_TYPES = ['LFP磷酸铁锂', 'NCM三元锂', '全钒液流', '铁铬液流', '钠离子'];
const CONNECTION_TYPES = ['IEC61850协议', 'MODBUS TCP', 'MODBUS RTU', 'OCPP 1.6', '电表直采', '风机通讯协议', 'DNP3.0', '私有协议'];

// ─── 视频监控占位 ──────────────────────────────────────────────────────────────
const cameras = ['主控室', '电池舱 A 区', '电池舱 B 区', 'PCS 设备间'];

function VideoPlaceholder({ label }: { label: string }) {
  return (
    <div style={{
      background: '#060b14',
      border: '1px solid rgba(0,212,255,0.15)',
      borderRadius: 8,
      aspectRatio: '16/9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 扫描线动画 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 2, background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)',
        animation: 'scanline 3s linear infinite',
      }} />
      <VideoCameraOutlined style={{ color: 'rgba(0,212,255,0.3)', fontSize: 28 }} />
      <div style={{ color: 'rgba(0,212,255,0.5)', fontSize: 11 }}>{label}</div>
      <div style={{
        position: 'absolute', top: 8, right: 8,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#ff4d4d', animation: 'pulse 1.5s infinite',
        }} />
        <span style={{ color: '#ff4d4d', fontSize: 9, fontWeight: 700 }}>LIVE</span>
      </div>
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        color: 'rgba(0,212,255,0.4)', fontSize: 9, fontFamily: 'monospace',
      }}>
        {new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
    </div>
  );
}

// ─── 详情 Drawer 各 Tab ─────────────────────────────────────────────────────────
function DeviceInfoTab({ d }: { d: Device }) {
  const rows = [
    { label: '设备 ID', value: d.id },
    { label: '设备类型', value: d.type },
    { label: '运行状态', value: d.status },
    { label: '安装位置', value: d.location },
    { label: '额定功率', value: `${d.capacity} MW` },
    ...(d.energyCapacity ? [{ label: '额定容量', value: `${d.energyCapacity} MWh` }] : []),
    { label: '当前功率', value: `${d.currentPower} MW` },
    ...(d.connectionType ? [{ label: '接入方式', value: d.connectionType }] : []),
    ...(d.commissionDate ? [{ label: '投运日期', value: d.commissionDate }] : []),
    ...(d.warrantyYears ? [{ label: '质保年限', value: `${d.warrantyYears} 年` }] : []),
    ...(d.investmentCost ? [{ label: '投资成本', value: `¥ ${d.investmentCost.toLocaleString()} 万元` }] : []),
    { label: '最后更新', value: d.lastUpdate },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 电网储能专属信息 */}
      {d.type === '电网储能' && (
        <Card style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 10 }}
          styles={{ body: { padding: 14 } }}>
          <div style={{ color: '#38bdf8', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>⚡ 电网侧独立储能</div>
          {[
            { label: '站点', value: d.station },
            { label: '申报公司', value: d.company },
            { label: '项目名称', value: d.projectName },
            { label: '建设地点', value: d.buildLocation },
          ].filter(i => i.value).map(item => (
            <div key={item.label} style={{ marginBottom: 8 }}>
              <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 2 }}>{item.label}</div>
              <div style={{ color: '#e2e8f0', fontSize: 12, lineHeight: 1.5 }}>{item.value}</div>
            </div>
          ))}
        </Card>
      )}

      <Card style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }}
        styles={{ body: { padding: 16 } }}>
        {rows.map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#4a6080', fontSize: 13 }}>{item.label}</span>
            <span style={{ color: '#e2e8f0', fontSize: 13 }}>{item.value}</span>
          </div>
        ))}
        {d.soc !== undefined && (
          <div>
            <div style={{ color: '#4a6080', fontSize: 13, marginBottom: 6 }}>荷电状态 SOC</div>
            <Progress percent={d.soc} strokeColor={d.soc > 50 ? '#00ff88' : '#ffb800'} trailColor="#1a2540" />
          </div>
        )}
      </Card>

      <Card title={<span style={{ color: '#00d4ff', fontSize: 13 }}>功率利用率</span>}
        style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }}
        styles={{ header: { background: 'transparent', borderBottom: '1px solid rgba(0,212,255,0.1)' }, body: { padding: 16, display: 'flex', justifyContent: 'center' } }}>
        <Progress type="circle" percent={d.capacity > 0 ? Math.round(d.currentPower / d.capacity * 100) : 0}
          strokeColor="#00d4ff" trailColor="#1a2540"
          format={p => <span style={{ color: '#00d4ff' }}>{p}%</span>} />
      </Card>
    </div>
  );
}

function BmsTab({ d }: { d: Device }) {
  const hasData = d.soh !== undefined || d.bmsModel;
  if (!hasData) {
    return <div style={{ color: '#4a6080', textAlign: 'center', paddingTop: 40 }}>该设备暂无 BMS 数据</div>;
  }
  const voltDiff = d.maxCellVoltage && d.minCellVoltage ? d.maxCellVoltage - d.minCellVoltage : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* BMS 告警 */}
      {d.bmsAlarms && d.bmsAlarms.length > 0 ? (
        d.bmsAlarms.map((alarm, i) => (
          <Alert key={i} message={alarm} type="warning" showIcon icon={<WarningOutlined />}
            style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.3)' }} />
        ))
      ) : (
        <Alert message="BMS 无告警，系统运行正常" type="success" showIcon icon={<CheckCircleOutlined />}
          style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }} />
      )}

      {/* SOH + 循环次数 */}
      <Row gutter={12}>
        <Col span={14}>
          <Card style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }}
            styles={{ body: { padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center' } }}>
            <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 8 }}>电池健康度 SOH</div>
            <Progress type="circle" percent={d.soh ?? 100}
              strokeColor={d.soh! >= 90 ? '#00ff88' : d.soh! >= 80 ? '#ffb800' : '#ff4d4d'}
              trailColor="#1a2540" size={90}
              format={p => <span style={{ color: '#e2e8f0', fontSize: 14 }}>{p}%</span>} />
            <div style={{ color: '#4a6080', fontSize: 10, marginTop: 8 }}>
              {d.soh! >= 90 ? '健康' : d.soh! >= 80 ? '良好' : '需关注'}
            </div>
          </Card>
        </Col>
        <Col span={10}>
          <Card style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)', height: '100%' }}
            styles={{ body: { padding: 14 } }}>
            <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 6 }}>累计循环次数</div>
            <div style={{ color: '#00d4ff', fontSize: 24, fontWeight: 700 }}>{d.cycleCount ?? '—'}</div>
            <div style={{ color: '#4a6080', fontSize: 10, marginTop: 4 }}>次 / 设计寿命 6000次</div>
            {d.cycleCount && (
              <Progress percent={Math.round(d.cycleCount / 6000 * 100)} size="small"
                strokeColor="#00d4ff" trailColor="#1a2540" style={{ marginTop: 8 }} />
            )}
          </Card>
        </Col>
      </Row>

      {/* 单体电压 */}
      {d.maxCellVoltage && (
        <Card title={<span style={{ color: '#aab4c8', fontSize: 12 }}>单体电压（mV）</span>}
          style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }}
          styles={{ header: { background: 'transparent', borderBottom: '1px solid rgba(0,212,255,0.08)', padding: '8px 14px', minHeight: 'auto' }, body: { padding: 14 } }}>
          <Row gutter={12}>
            {[
              { label: '最高', value: d.maxCellVoltage, color: '#00ff88' },
              { label: '最低', value: d.minCellVoltage, color: '#ffb800' },
              { label: '压差', value: voltDiff, color: voltDiff && voltDiff > 20 ? '#ff4d4d' : '#aab4c8' },
            ].map(item => (
              <Col key={item.label} span={8} style={{ textAlign: 'center' }}>
                <div style={{ color: '#4a6080', fontSize: 11 }}>{item.label}</div>
                <div style={{ color: item.color, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>{item.value}</div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 设备配置 */}
      <Card title={<span style={{ color: '#aab4c8', fontSize: 12 }}>设备配置</span>}
        style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }}
        styles={{ header: { background: 'transparent', borderBottom: '1px solid rgba(0,212,255,0.08)', padding: '8px 14px', minHeight: 'auto' }, body: { padding: 14 } }}>
        {[
          { label: '电池类型', value: d.batteryType },
          { label: '电池规格', value: d.batterySpec },
          { label: 'BMS 型号', value: d.bmsModel },
          { label: 'PCS 型号', value: d.pcsModel },
          { label: 'EMS 品牌', value: d.emsModel },
        ].filter(i => i.value).map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#4a6080', fontSize: 12 }}>{item.label}</span>
            <span style={{ color: '#e2e8f0', fontSize: 12 }}>{item.value}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function EnvTab({ d }: { d: Device }) {
  const hasEnv = d.temperature !== undefined || d.humidity !== undefined;
  if (!hasEnv) {
    return <div style={{ color: '#4a6080', textAlign: 'center', paddingTop: 40 }}>该设备暂无环境监测数据</div>;
  }

  const envItems = [
    { label: '环境温度', value: d.temperature, unit: '°C', warn: d.temperature! > 35 || d.temperature! < 5, color: '#00d4ff' },
    { label: '环境湿度', value: d.humidity, unit: '%', warn: d.humidity! > 70, color: '#a78bfa' },
    { label: '电芯最高温', value: d.cellMaxTemp, unit: '°C', warn: d.cellMaxTemp! > 40, color: '#ffb800' },
    { label: '电芯最低温', value: d.cellMinTemp, unit: '°C', warn: false, color: '#00ff88' },
    { label: '电芯温差', value: d.cellMaxTemp && d.cellMinTemp ? +(d.cellMaxTemp - d.cellMinTemp).toFixed(1) : undefined, unit: '°C', warn: (d.cellMaxTemp! - d.cellMinTemp!) > 5, color: '#fb923c' },
  ].filter(i => i.value !== undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row gutter={[12, 12]}>
        {envItems.map(item => (
          <Col key={item.label} span={12}>
            <Card style={{
              background: '#111827',
              border: `1px solid ${item.warn ? 'rgba(255,77,77,0.3)' : 'rgba(0,212,255,0.15)'}`,
              borderRadius: 10,
            }} styles={{ body: { padding: 14 } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ color: '#4a6080', fontSize: 11 }}>{item.label}</div>
                {item.warn && <WarningOutlined style={{ color: '#ffb800', fontSize: 12 }} />}
              </div>
              <div style={{ color: item.warn ? '#ffb800' : item.color, fontSize: 26, fontWeight: 700, marginTop: 4, fontFamily: 'monospace' }}>
                {item.value}
                <span style={{ fontSize: 12, marginLeft: 2, color: '#4a6080' }}>{item.unit}</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 温度横向进度条 */}
      {d.temperature !== undefined && (
        <Card style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }}
          styles={{ body: { padding: 14 } }}>
          <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 10 }}>环境温度区间（0°C ~ 45°C）</div>
          <Progress
            percent={Math.min(100, Math.max(0, Math.round(d.temperature! / 45 * 100)))}
            strokeColor={d.temperature! > 35 ? '#ff4d4d' : d.temperature! > 25 ? '#ffb800' : '#00ff88'}
            trailColor="#1a2540"
            format={() => `${d.temperature}°C`}
          />
        </Card>
      )}

      {d.humidity !== undefined && (
        <Card style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }}
          styles={{ body: { padding: 14 } }}>
          <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 10 }}>湿度区间（0% ~ 100%）</div>
          <Progress
            percent={d.humidity}
            strokeColor={d.humidity! > 70 ? '#ff4d4d' : d.humidity! > 60 ? '#ffb800' : '#a78bfa'}
            trailColor="#1a2540"
            format={() => `${d.humidity}%`}
          />
        </Card>
      )}
    </div>
  );
}

function VideoTab() {
  return (
    <div>
      <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 12 }}>
        <VideoCameraOutlined style={{ marginRight: 4 }} />
        实时视频监控（4路）· 信号正常
      </div>
      <Row gutter={[10, 10]}>
        {cameras.map(cam => (
          <Col key={cam} span={12}>
            <VideoPlaceholder label={cam} />
          </Col>
        ))}
      </Row>
      <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(0,212,255,0.04)', borderRadius: 6, border: '1px solid rgba(0,212,255,0.1)' }}>
        <div style={{ color: '#4a6080', fontSize: 11 }}>录像存储：本地 NVR · 保留 30 天 · H.265 压缩</div>
      </div>
    </div>
  );
}

// ─── 新增设备 Modal ─────────────────────────────────────────────────────────────
function AddDeviceModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (d: Device) => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    form.validateFields().then(values => {
      setLoading(true);
      setTimeout(() => {
        const isStorage = ['储能系统', '电网储能'].includes(values.type);
        const newDevice: Device = {
          id: `D${String(Date.now()).slice(-4)}`,
          name: values.name,
          type: values.type,
          status: '离线',
          capacity: values.capacity,
          energyCapacity: values.energyCapacity,
          currentPower: 0,
          location: values.location,
          lastUpdate: new Date().toLocaleString('zh-CN'),
          soc: isStorage ? 50 : undefined,
          soh: isStorage ? 100 : undefined,
          connectionType: values.connectionType,
          batteryType: values.batteryType,
          batterySpec: values.batterySpec,
          bmsModel: values.bmsModel,
          pcsModel: values.pcsModel,
          emsModel: values.emsModel,
          investmentCost: values.investmentCost,
          commissionDate: values.commissionDate,
          warrantyYears: values.warrantyYears,
          cycleCount: 0,
          temperature: 25,
          humidity: 55,
          bmsAlarms: [],
        };
        onAdd(newDevice);
        message.success(`设备「${newDevice.name}」已成功录入`);
        form.resetFields();
        setLoading(false);
        onClose();
      }, 600);
    });
  };

  const labelStyle = { color: '#aab4c8', fontSize: 12 };
  const inputStyle = { background: '#0d1526', border: '1px solid rgba(0,212,255,0.2)', color: '#e2e8f0' };

  return (
    <Modal
      title={<span style={{ color: '#00d4ff' }}><PlusOutlined /> 新增设备资产</span>}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="录入设备"
      cancelText="取消"
      width={620}
      okButtonProps={{ style: { background: '#00d4ff', border: 'none', color: '#0a0e1a' } }}
      styles={{ body: { background: '#1a2540', maxHeight: '70vh', overflowY: 'auto' }, header: { background: '#1a2540' } }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        {/* 基础信息 */}
        <div style={{ color: '#00d4ff', fontSize: 11, fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>▌ 基础信息</div>
        <Row gutter={12}>
          <Col span={14}>
            <Form.Item label={<span style={labelStyle}>设备名称</span>} name="name" rules={[{ required: true, message: '请输入设备名称' }]}>
              <Input style={inputStyle} placeholder="例：富山站储能" />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item label={<span style={labelStyle}>设备类型</span>} name="type" rules={[{ required: true }]}>
              <Select style={{ width: '100%' }}>
                {['光伏电站', '储能系统', '电网储能', '风电', '充电桩', '工业负荷'].map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label={<span style={labelStyle}>安装位置</span>} name="location" rules={[{ required: true }]}>
          <Input style={inputStyle} placeholder="省市区详细地址" />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label={<span style={labelStyle}>装机容量（MW）</span>} name="capacity" rules={[{ required: true }]}>
              <InputNumber style={{ ...inputStyle, width: '100%' }} min={0} precision={1} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={<span style={labelStyle}>储能容量（MWh，储能填写）</span>} name="energyCapacity">
              <InputNumber style={{ ...inputStyle, width: '100%' }} min={0} precision={1} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label={<span style={labelStyle}>投运日期</span>} name="commissionDate">
              <Input style={inputStyle} placeholder="例：2025-06-15" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={<span style={labelStyle}>投资成本（万元）</span>} name="investmentCost">
              <InputNumber style={{ ...inputStyle, width: '100%' }} min={0} />
            </Form.Item>
          </Col>
        </Row>

        {/* 接入配置 */}
        <div style={{ color: '#00d4ff', fontSize: 11, fontWeight: 600, margin: '14px 0 10px', letterSpacing: 1 }}>▌ 接入配置</div>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label={<span style={labelStyle}>接入方式 / 通信协议</span>} name="connectionType">
              <Select style={{ width: '100%' }} placeholder="请选择接入方式">
                {CONNECTION_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={<span style={labelStyle}>质保年限（年）</span>} name="warrantyYears">
              <InputNumber style={{ ...inputStyle, width: '100%' }} min={1} max={20} />
            </Form.Item>
          </Col>
        </Row>

        {/* 电池及核心部件 */}
        <div style={{ color: '#00d4ff', fontSize: 11, fontWeight: 600, margin: '14px 0 10px', letterSpacing: 1 }}>▌ 电池及核心部件（储能设备填写）</div>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label={<span style={labelStyle}>电池类型</span>} name="batteryType">
              <Select style={{ width: '100%' }} placeholder="请选择电池类型">
                {BATTERY_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={<span style={labelStyle}>电池规格型号</span>} name="batterySpec">
              <Input style={inputStyle} placeholder="例：314Ah / 3.2V" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label={<span style={labelStyle}>BMS 品牌型号</span>} name="bmsModel">
              <Input style={inputStyle} placeholder="例：科陆 BMS-3000" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={<span style={labelStyle}>PCS 品牌型号</span>} name="pcsModel">
              <Input style={inputStyle} placeholder="例：阳光 SG3125HV" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={<span style={labelStyle}>EMS 品牌</span>} name="emsModel">
              <Input style={inputStyle} placeholder="例：汇图EMS V2.1" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────
export default function Devices() {
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = devices.filter(d => {
    const matchSearch = d.name.includes(search) || d.id.includes(search) || d.location.includes(search);
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setDevices(prev => prev.map(d => ({
        ...d,
        currentPower: d.status === '在线'
          ? parseFloat((d.currentPower * (0.95 + Math.random() * 0.1)).toFixed(1))
          : d.currentPower,
        soc: d.soc !== undefined
          ? Math.min(100, Math.max(0, d.soc + Math.round((Math.random() - 0.4) * 3)))
          : undefined,
        lastUpdate: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      })));
      setRefreshing(false);
      message.success('数据已刷新');
    }, 800);
  };

  const handleToggle = (record: Device) => {
    const isOnline = record.status === '在线';
    Modal.confirm({
      title: isOnline ? '确认停止设备？' : '确认启动设备？',
      content: `设备：${record.name}`,
      okText: isOnline ? '停止' : '启动',
      cancelText: '取消',
      okButtonProps: { style: { background: isOnline ? '#ff4d4d' : '#00d4ff', border: 'none', color: isOnline ? '#fff' : '#0a0e1a' } },
      onOk: () => {
        setDevices(prev => prev.map(d =>
          d.id === record.id ? { ...d, status: isOnline ? '离线' : '在线', currentPower: isOnline ? 0 : d.capacity * 0.6 } : d
        ));
        message.success(`设备 ${record.name} 已${isOnline ? '停止' : '启动'}`);
      },
    });
  };

  const handleRestart = (record: Device) => {
    Modal.confirm({
      title: '确认重启设备？',
      content: `设备：${record.name}，重启期间将短暂离线`,
      okText: '重启',
      cancelText: '取消',
      okButtonProps: { style: { background: '#ffb800', border: 'none', color: '#0a0e1a' } },
      onOk: () => {
        setDevices(prev => prev.map(d => d.id === record.id ? { ...d, status: '维护' } : d));
        message.info(`设备 ${record.name} 重启中...`);
        setTimeout(() => {
          setDevices(prev => prev.map(d => d.id === record.id ? { ...d, status: '在线', currentPower: d.capacity * 0.65 } : d));
          message.success(`设备 ${record.name} 重启完成`);
        }, 3000);
      },
    });
  };

  const columns: ColumnType<Device>[] = [
    {
      title: '设备ID', dataIndex: 'id', width: 90,
      render: (v: string) => <span style={{ color: '#00d4ff', fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: '设备名称', dataIndex: 'name',
      render: (v: string) => <span style={{ color: '#e2e8f0' }}>{v}</span>,
    },
    {
      title: '类型', dataIndex: 'type',
      render: (v: string) => <Tag color={typeColors[v]} style={{ border: 'none' }}>{v}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status',
      render: (v: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusConfig[v].dot, boxShadow: `0 0 6px ${statusConfig[v].dot}`, animation: v === '在线' ? 'pulse 2s infinite' : 'none' }} />
          <Tag color={statusConfig[v].color}>{v}</Tag>
        </div>
      ),
    },
    {
      title: '装机容量', dataIndex: 'capacity',
      render: (v: number) => <span style={{ color: '#aab4c8' }}>{v} MW</span>,
    },
    {
      title: '当前功率', dataIndex: 'currentPower',
      render: (v: number, record: Device) => (
        <div>
          <span style={{ color: '#00d4ff', fontWeight: 600 }}>{v} MW</span>
          <Progress percent={record.capacity > 0 ? Math.round(v / record.capacity * 100) : 0}
            size="small" showInfo={false} strokeColor="#00d4ff" trailColor="#1a2540" style={{ marginTop: 2, width: 80 }} />
        </div>
      ),
    },
    {
      title: 'SOC / SOH', dataIndex: 'soc',
      render: (v?: number, record?: Device) => v !== undefined ? (
        <div>
          <div style={{ fontSize: 11, color: '#4a6080', marginBottom: 2 }}>SOC</div>
          <Progress percent={v} size="small" strokeColor={v > 50 ? '#00ff88' : '#ffb800'} trailColor="#1a2540" style={{ width: 80 }} />
          {record?.soh !== undefined && (
            <>
              <div style={{ fontSize: 11, color: '#4a6080', marginTop: 4, marginBottom: 2 }}>SOH</div>
              <Progress percent={record.soh} size="small" strokeColor={record.soh >= 90 ? '#00d4ff' : '#ff4d4d'} trailColor="#1a2540" style={{ width: 80 }} />
            </>
          )}
        </div>
      ) : <span style={{ color: '#4a5568' }}>—</span>,
    },
    {
      title: '位置', dataIndex: 'location',
      render: (v: string) => <span style={{ color: '#6b7280', fontSize: 12 }}>{v}</span>,
    },
    {
      title: '操作', width: 110,
      render: (_: unknown, record: Device) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} size="small"
              style={{ color: '#00d4ff', padding: '0 4px' }} onClick={() => setSelectedDevice(record)} />
          </Tooltip>
          <Tooltip title={record.status === '在线' ? '停止设备' : '启动设备'}>
            <Button type="link" icon={record.status === '在线' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              size="small" style={{ color: record.status === '在线' ? '#ff4d4d' : '#00ff88', padding: '0 4px' }}
              onClick={() => handleToggle(record)} />
          </Tooltip>
          <Tooltip title="重启设备">
            <Button type="link" icon={<SyncOutlined />} size="small"
              style={{ color: '#ffb800', padding: '0 4px' }} onClick={() => handleRestart(record)}
              disabled={record.status === '维护'} />
          </Tooltip>
        </div>
      ),
    },
  ];

  const hasStorage = selectedDevice && (selectedDevice.type === '储能系统' || selectedDevice.type === '电网储能');

  const detailTabs = selectedDevice ? [
    {
      key: '1', label: <span><ToolOutlined /> 设备信息</span>,
      children: <DeviceInfoTab d={selectedDevice} />,
    },
    ...(hasStorage ? [{
      key: '2', label: <span><ThunderboltOutlined /> BMS & 电池</span>,
      children: <BmsTab d={selectedDevice} />,
    }] : []),
    {
      key: '3', label: <span><EnvironmentOutlined /> 环境监控</span>,
      children: <EnvTab d={selectedDevice} />,
    },
    {
      key: '4', label: <span><VideoCameraOutlined /> 视频监控</span>,
      children: <VideoTab />,
    },
  ] : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: '#00d4ff', margin: 0, fontSize: 20, letterSpacing: 1 }}>设备资产管理</h2>
          <p style={{ color: '#4a6080', margin: '4px 0 0', fontSize: 12 }}>
            共 {devices.length} 台设备 · 在线 {devices.filter(d => d.status === '在线').length} 台 ·
            告警 {devices.filter(d => d.status === '告警').length} 台
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: '#00d4ff', border: 'none', color: '#0a0e1a', fontWeight: 600 }}
          onClick={() => setAddOpen(true)}
        >
          新增设备
        </Button>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {Object.entries({ '电网储能': '🏗️', '光伏电站': '☀️', '储能系统': '🔋', '风电': '💨', '充电桩': '🚗', '工业负荷': '🏭' }).map(([type, icon]) => {
          const typeDevices = devices.filter(d => d.type === type);
          const online = typeDevices.filter(d => d.status === '在线').length;
          const totalPower = typeDevices.reduce((a, d) => a + d.currentPower, 0);
          const totalCapacity = typeDevices.reduce((a, d) => a + d.capacity, 0);
          return (
            <Col key={type} flex="1" style={{ minWidth: 130 }}>
              <Card style={{ background: '#111827', border: `1px solid ${typeColors[type]}30`, borderRadius: 10 }}
                styles={{ body: { padding: '12px 16px' } }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                <div style={{ color: typeColors[type], fontWeight: 600, fontSize: 12 }}>{type}</div>
                <div style={{ color: '#aab4c8', fontSize: 11 }}>{online}/{typeDevices.length} 在线</div>
                <div style={{ color: '#4a6080', fontSize: 11, marginTop: 2 }}>{totalPower.toFixed(1)}/{totalCapacity} MW</div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#4a6080' }} />}
          placeholder="搜索设备名称、ID、位置..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260, background: '#111827', border: '1px solid rgba(0,212,255,0.2)', color: '#e2e8f0' }}
        />
        <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 140 }}>
          <Option value="all">全部类型</Option>
          {['电网储能', '光伏电站', '储能系统', '风电', '充电桩', '工业负荷'].map(t => (
            <Option key={t} value={t}>{t}</Option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
          <Option value="all">全部状态</Option>
          {['在线', '离线', '维护', '告警'].map(s => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
        <Button icon={<ReloadOutlined spin={refreshing} />}
          style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}
          onClick={handleRefresh} loading={refreshing}>
          刷新数据
        </Button>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        style={{ background: 'transparent' }}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onDoubleClick: () => setSelectedDevice(record),
        })}
      />

      {/* Detail Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedDevice ? statusConfig[selectedDevice.status].dot : '#4a5568' }} />
            <span style={{ color: '#00d4ff' }}>{selectedDevice?.name}</span>
            <Tag color={selectedDevice ? typeColors[selectedDevice.type] : 'default'} style={{ border: 'none', fontSize: 11 }}>{selectedDevice?.type}</Tag>
          </div>
        }
        open={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        width={600}
        styles={{
          body: { background: '#0d1526', padding: 16 },
          header: { background: '#0d1526', borderBottom: '1px solid rgba(0,212,255,0.15)' },
        }}
      >
        {selectedDevice && (
          <div>
            <Tabs
              defaultActiveKey="1"
              items={detailTabs}
              style={{ color: '#aab4c8' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button block
                style={{ background: selectedDevice.status === '在线' ? 'rgba(255,77,77,0.1)' : 'rgba(0,255,136,0.1)', border: `1px solid ${selectedDevice.status === '在线' ? '#ff4d4d' : '#00ff88'}`, color: selectedDevice.status === '在线' ? '#ff4d4d' : '#00ff88' }}
                icon={selectedDevice.status === '在线' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => { handleToggle(selectedDevice); setSelectedDevice(null); }}>
                {selectedDevice.status === '在线' ? '停止设备' : '启动设备'}
              </Button>
              <Button block
                style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid #ffb800', color: '#ffb800' }}
                icon={<SyncOutlined />}
                onClick={() => { handleRestart(selectedDevice); setSelectedDevice(null); }}>
                重启设备
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Device Modal */}
      <AddDeviceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={d => setDevices(prev => [...prev, d])}
      />
    </div>
  );
}
