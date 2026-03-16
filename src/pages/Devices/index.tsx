import { useState } from 'react';
import { Table, Tag, Input, Select, Button, Drawer, Row, Col, Card, Progress, Modal, message, Tooltip } from 'antd';
import {
  SearchOutlined, EyeOutlined, ReloadOutlined,
  PlayCircleOutlined, PauseCircleOutlined, SyncOutlined,
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

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
      okButtonProps: {
        style: { background: isOnline ? '#ff4d4d' : '#00d4ff', border: 'none', color: isOnline ? '#fff' : '#0a0e1a' },
      },
      onOk: () => {
        setDevices(prev => prev.map(d =>
          d.id === record.id
            ? { ...d, status: isOnline ? '离线' : '在线', currentPower: isOnline ? 0 : d.capacity * 0.6 }
            : d
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
        setDevices(prev => prev.map(d =>
          d.id === record.id ? { ...d, status: '维护' } : d
        ));
        message.info(`设备 ${record.name} 重启中...`);
        setTimeout(() => {
          setDevices(prev => prev.map(d =>
            d.id === record.id ? { ...d, status: '在线', currentPower: d.capacity * 0.65 } : d
          ));
          message.success(`设备 ${record.name} 重启完成`);
        }, 3000);
      },
    });
  };

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
      width: 150,
      render: (_: unknown, record: Device) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
              style={{ color: '#00d4ff', padding: '0 4px' }}
              onClick={() => setSelectedDevice(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === '在线' ? '停止设备' : '启动设备'}>
            <Button
              type="link"
              icon={record.status === '在线' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              size="small"
              style={{ color: record.status === '在线' ? '#ff4d4d' : '#00ff88', padding: '0 4px' }}
              onClick={() => handleToggle(record)}
            />
          </Tooltip>
          <Tooltip title="重启设备">
            <Button
              type="link"
              icon={<SyncOutlined />}
              size="small"
              style={{ color: '#ffb800', padding: '0 4px' }}
              onClick={() => handleRestart(record)}
              disabled={record.status === '维护'}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#00d4ff', margin: 0, fontSize: 20, letterSpacing: 1 }}>
          设备资产管理
        </h2>
        <p style={{ color: '#4a6080', margin: '4px 0 0', fontSize: 12 }}>
          共 {devices.length} 台设备 · 在线 {devices.filter(d => d.status === '在线').length} 台 ·
          告警 {devices.filter(d => d.status === '告警').length} 台
        </p>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {Object.entries({ '光伏电站': '☀️', '储能系统': '🔋', '电网储能': '🏗️', '风电': '💨', '充电桩': '🚗', '工业负荷': '🏭' }).map(([type, icon]) => {
          const typeDevices = devices.filter(d => d.type === type);
          const online = typeDevices.filter(d => d.status === '在线').length;
          const totalPower = typeDevices.reduce((a, d) => a + d.currentPower, 0);
          const totalCapacity = typeDevices.reduce((a, d) => a + d.capacity, 0);
          return (
            <Col key={type} flex="1" style={{ minWidth: 130 }}>
              <Card
                style={{ background: '#111827', border: `1px solid ${typeColors[type]}30`, borderRadius: 10 }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                <div style={{ color: typeColors[type], fontWeight: 600, fontSize: 12 }}>{type}</div>
                <div style={{ color: '#aab4c8', fontSize: 11 }}>{online}/{typeDevices.length} 在线</div>
                <div style={{ color: '#4a6080', fontSize: 11, marginTop: 2 }}>
                  {totalPower.toFixed(1)}/{totalCapacity} MW
                </div>
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
          {['光伏电站', '储能系统', '电网储能', '风电', '充电桩', '工业负荷'].map(t => (
            <Option key={t} value={t}>{t}</Option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
          <Option value="all">全部状态</Option>
          {['在线', '离线', '维护', '告警'].map(s => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
        <Button
          icon={<ReloadOutlined spin={refreshing} />}
          style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}
          onClick={handleRefresh}
          loading={refreshing}
        >
          刷新数据
        </Button>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 条` }}
        style={{ background: 'transparent' }}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onDoubleClick: () => setSelectedDevice(record),
        })}
      />

      {/* Detail Drawer */}
      <Drawer
        title={<span style={{ color: '#00d4ff' }}>{selectedDevice?.name} · 设备详情</span>}
        open={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        width={420}
        styles={{
          body: { background: '#0d1526' },
          header: { background: '#0d1526', borderBottom: '1px solid rgba(0,212,255,0.15)' },
        }}
      >
        {selectedDevice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 电网储能专属信息卡 */}
            {selectedDevice.type === '电网储能' && (
              <Card
                style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 10 }}
                styles={{ body: { padding: 14 } }}
              >
                <div style={{ color: '#38bdf8', fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>
                  ⚡ 电网侧独立储能
                </div>
                {[
                  { label: '站点', value: selectedDevice.station },
                  { label: '申报公司', value: selectedDevice.company },
                  { label: '项目名称', value: selectedDevice.projectName },
                  { label: '建设地点', value: selectedDevice.buildLocation },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} style={{ marginBottom: 8 }}>
                    <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ color: '#e2e8f0', fontSize: 12, lineHeight: 1.5 }}>{item.value}</div>
                  </div>
                ))}
              </Card>
            )}

            <Card style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }} styles={{ body: { padding: 16 } }}>
              <Row gutter={[16, 12]}>
                {[
                  { label: '设备ID', value: selectedDevice.id },
                  { label: '设备类型', value: selectedDevice.type },
                  { label: '运行状态', value: selectedDevice.status },
                  { label: '安装位置', value: selectedDevice.location },
                  { label: '额定功率', value: `${selectedDevice.capacity} MW` },
                  ...(selectedDevice.energyCapacity ? [{ label: '额定容量', value: `${selectedDevice.energyCapacity} MWh` }] : []),
                  { label: '当前功率', value: `${selectedDevice.currentPower} MW` },
                  { label: '利用率', value: `${selectedDevice.capacity > 0 ? Math.round(selectedDevice.currentPower / selectedDevice.capacity * 100) : 0}%` },
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
              styles={{
                header: { background: 'transparent', borderBottom: '1px solid rgba(0,212,255,0.1)' },
                body: { padding: 16, display: 'flex', justifyContent: 'center' },
              }}
            >
              <Progress
                type="circle"
                percent={selectedDevice.capacity > 0
                  ? Math.round((selectedDevice.currentPower / selectedDevice.capacity) * 100)
                  : 0
                }
                strokeColor="#00d4ff"
                trailColor="#1a2540"
                format={p => <span style={{ color: '#00d4ff' }}>{p}%</span>}
              />
            </Card>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                block
                style={{
                  background: selectedDevice.status === '在线' ? 'rgba(255,77,77,0.1)' : 'rgba(0,255,136,0.1)',
                  border: `1px solid ${selectedDevice.status === '在线' ? '#ff4d4d' : '#00ff88'}`,
                  color: selectedDevice.status === '在线' ? '#ff4d4d' : '#00ff88',
                }}
                icon={selectedDevice.status === '在线' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => {
                  handleToggle(selectedDevice);
                  setSelectedDevice(null);
                }}
              >
                {selectedDevice.status === '在线' ? '停止设备' : '启动设备'}
              </Button>
              <Button
                block
                style={{
                  background: 'rgba(255,184,0,0.1)',
                  border: '1px solid #ffb800',
                  color: '#ffb800',
                }}
                icon={<SyncOutlined />}
                onClick={() => {
                  handleRestart(selectedDevice);
                  setSelectedDevice(null);
                }}
              >
                重启设备
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
