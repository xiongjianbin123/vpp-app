import { useState } from 'react';
import { Table, Tag, Input, Select, Button, Drawer, Row, Col, Card, Progress } from 'antd';
import { SearchOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
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
};

export default function Devices() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const filtered = mockDevices.filter(d => {
    const matchSearch = d.name.includes(search) || d.id.includes(search) || d.location.includes(search);
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const columns: ColumnType<Device>[] = [
    {
      title: '设备ID',
      dataIndex: 'id',
      width: 90,
      render: (v: string) => <span style={{ color: '#00d4ff', fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      render: (v: string) => <span style={{ color: '#e2e8f0' }}>{v}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (v: string) => (
        <Tag color={typeColors[v]} style={{ border: 'none' }}>{v}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: statusConfig[v].dot,
            boxShadow: `0 0 6px ${statusConfig[v].dot}`,
            animation: v === '在线' ? 'pulse 2s infinite' : 'none',
          }} />
          <Tag color={statusConfig[v].color}>{v}</Tag>
        </div>
      ),
    },
    {
      title: '装机容量',
      dataIndex: 'capacity',
      render: (v: number) => <span style={{ color: '#aab4c8' }}>{v} MW</span>,
    },
    {
      title: '当前功率',
      dataIndex: 'currentPower',
      render: (v: number, record: Device) => (
        <div>
          <span style={{ color: '#00d4ff', fontWeight: 600 }}>{v} MW</span>
          <Progress
            percent={record.capacity > 0 ? Math.round((v / record.capacity) * 100) : 0}
            size="small"
            showInfo={false}
            strokeColor="#00d4ff"
            trailColor="#1a2540"
            style={{ marginTop: 2, width: 80 }}
          />
        </div>
      ),
    },
    {
      title: '荷电状态',
      dataIndex: 'soc',
      render: (v?: number) => v !== undefined ? (
        <Progress
          percent={v}
          size="small"
          strokeColor={v > 50 ? '#00ff88' : '#ffb800'}
          trailColor="#1a2540"
          style={{ width: 80 }}
        />
      ) : <span style={{ color: '#4a5568' }}>-</span>,
    },
    {
      title: '位置',
      dataIndex: 'location',
      render: (v: string) => <span style={{ color: '#6b7280', fontSize: 12 }}>{v}</span>,
    },
    {
      title: '操作',
      render: (_: unknown, record: Device) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          style={{ color: '#00d4ff' }}
          onClick={() => setSelectedDevice(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#00d4ff', margin: 0, fontSize: 20, letterSpacing: 1 }}>
          🔌 设备资产管理
        </h2>
        <p style={{ color: '#4a6080', margin: '4px 0 0', fontSize: 12 }}>
          共 {mockDevices.length} 台设备 · 在线 {mockDevices.filter(d => d.status === '在线').length} 台
        </p>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {Object.entries({ '光伏电站': '☀️', '储能系统': '🔋', '风电': '💨', '充电桩': '🚗', '工业负荷': '🏭' }).map(([type, icon]) => {
          const devices = mockDevices.filter(d => d.type === type);
          const online = devices.filter(d => d.status === '在线').length;
          return (
            <Col key={type} flex="1">
              <Card
                style={{ background: '#111827', border: `1px solid ${typeColors[type]}30`, borderRadius: 10 }}
                bodyStyle={{ padding: '12px 16px' }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <div style={{ color: typeColors[type], fontWeight: 600, fontSize: 13 }}>{type}</div>
                <div style={{ color: '#aab4c8', fontSize: 12 }}>{online}/{devices.length} 在线</div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#4a6080' }} />}
          placeholder="搜索设备名称、ID、位置..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260, background: '#111827', border: '1px solid rgba(0,212,255,0.2)', color: '#e2e8f0' }}
        />
        <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 140 }}>
          <Option value="all">全部类型</Option>
          {['光伏电站', '储能系统', '风电', '充电桩', '工业负荷'].map(t => (
            <Option key={t} value={t}>{t}</Option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
          <Option value="all">全部状态</Option>
          {['在线', '离线', '维护', '告警'].map(s => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
        <Button icon={<ReloadOutlined />} style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}>
          刷新
        </Button>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 条` }}
        style={{ background: 'transparent' }}
      />

      {/* Detail Drawer */}
      <Drawer
        title={<span style={{ color: '#00d4ff' }}>{selectedDevice?.name} · 设备详情</span>}
        open={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        width={400}
        styles={{ body: { background: '#0d1526' }, header: { background: '#0d1526', borderBottom: '1px solid rgba(0,212,255,0.15)' } }}
      >
        {selectedDevice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }} bodyStyle={{ padding: 16 }}>
              <Row gutter={[16, 12]}>
                {[
                  { label: '设备ID', value: selectedDevice.id },
                  { label: '设备类型', value: selectedDevice.type },
                  { label: '运行状态', value: selectedDevice.status },
                  { label: '安装位置', value: selectedDevice.location },
                  { label: '装机容量', value: `${selectedDevice.capacity} MW` },
                  { label: '当前功率', value: `${selectedDevice.currentPower} MW` },
                  { label: '最后更新', value: selectedDevice.lastUpdate },
                ].map(item => (
                  <Col span={24} key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#4a6080', fontSize: 13 }}>{item.label}</span>
                      <span style={{ color: '#e2e8f0', fontSize: 13 }}>{item.value}</span>
                    </div>
                  </Col>
                ))}
                {selectedDevice.soc !== undefined && (
                  <Col span={24}>
                    <div style={{ color: '#4a6080', fontSize: 13, marginBottom: 6 }}>荷电状态 (SOC)</div>
                    <Progress
                      percent={selectedDevice.soc}
                      strokeColor={selectedDevice.soc > 50 ? '#00ff88' : '#ffb800'}
                      trailColor="#1a2540"
                    />
                  </Col>
                )}
              </Row>
            </Card>

            <Card
              title={<span style={{ color: '#00d4ff', fontSize: 13 }}>功率利用率</span>}
              style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }}
              headStyle={{ background: 'transparent', borderBottom: '1px solid rgba(0,212,255,0.1)' }}
              bodyStyle={{ padding: 16 }}
            >
              <Progress
                type="circle"
                percent={selectedDevice.capacity > 0 ? Math.round((selectedDevice.currentPower / selectedDevice.capacity) * 100) : 0}
                strokeColor="#00d4ff"
                trailColor="#1a2540"
                format={p => <span style={{ color: '#00d4ff' }}>{p}%</span>}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
