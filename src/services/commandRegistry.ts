export type ParamDef = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  default?: string | number;
  placeholder?: string;
  required?: boolean;
};

export type CommandCategory = 'device' | 'task' | 'market' | 'revenue' | 'theme' | 'deploy' | 'info';

export type Command = {
  id: string;
  name: string;
  description: string;
  category: CommandCategory;
  method: 'GET' | 'POST';
  endpoint: string;
  params?: ParamDef[];
  dangerous?: boolean;  // orange warning
  critical?: boolean;   // red — deploy/destructive
};

export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  device: '设备',
  task: '任务',
  market: '现货',
  revenue: '收益',
  theme: '主题',
  deploy: '部署',
  info: '信息',
};

export const COMMANDS: Command[] = [
  // ── Info ──────────────────────────────────────────────────────────
  {
    id: 'project_info',
    name: '查看项目信息',
    description: '显示 vpp-app 版本、技术栈、页面数量',
    category: 'info',
    method: 'GET',
    endpoint: '/api/tools/project_info',
  },
  {
    id: 'git_status',
    name: '查看 Git 状态',
    description: '显示当前分支、未提交文件列表',
    category: 'info',
    method: 'GET',
    endpoint: '/api/tools/git_status',
  },
  // ── Device ────────────────────────────────────────────────────────
  {
    id: 'device_list',
    name: '查看设备列表',
    description: '列出所有设备，可按类型或状态过滤',
    category: 'device',
    method: 'GET',
    endpoint: '/api/tools/devices',
    params: [
      {
        key: 'type_filter',
        label: '设备类型',
        type: 'select',
        options: ['', '储能系统', '光伏电站', '风电', '充电桩', '工业负荷', '电网储能'],
        default: '',
      },
      {
        key: 'status_filter',
        label: '运行状态',
        type: 'select',
        options: ['', '在线', '离线', '维护', '告警'],
        default: '',
      },
    ],
  },
  {
    id: 'device_summary',
    name: '设备状态汇总',
    description: '在线/离线/告警设备数量，总装机容量',
    category: 'device',
    method: 'GET',
    endpoint: '/api/tools/device_summary',
  },
  // ── Task ──────────────────────────────────────────────────────────
  {
    id: 'task_list',
    name: '查看需求响应任务',
    description: '列出调峰/调频/备用任务，可按类型或状态过滤',
    category: 'task',
    method: 'GET',
    endpoint: '/api/tools/tasks',
    params: [
      {
        key: 'type_filter',
        label: '任务类型',
        type: 'select',
        options: ['', '调峰', '调频', '备用'],
        default: '',
      },
      {
        key: 'status_filter',
        label: '任务状态',
        type: 'select',
        options: ['', '待响应', '执行中', '已完成', '已取消'],
        default: '',
      },
    ],
  },
  {
    id: 'task_summary',
    name: '任务执行汇总',
    description: '任务总数、各状态数量、总奖励金额',
    category: 'task',
    method: 'GET',
    endpoint: '/api/tools/task_summary',
  },
  // ── Market ────────────────────────────────────────────────────────
  {
    id: 'market_prices',
    name: '查看 24h 市场价格',
    description: '显示今日全部时段的现货出价',
    category: 'market',
    method: 'GET',
    endpoint: '/api/tools/market',
  },
  {
    id: 'market_summary',
    name: '市场价格统计',
    description: '峰谷均价、峰谷差统计',
    category: 'market',
    method: 'GET',
    endpoint: '/api/tools/market_summary',
  },
  {
    id: 'market_strategy',
    name: '查看套利策略窗口',
    description: '推荐充放电时段，基于当前价格自动计算',
    category: 'market',
    method: 'GET',
    endpoint: '/api/tools/market_strategy',
  },
  {
    id: 'update_all_prices',
    name: '批量调整出价',
    description: '按百分比整体上调/下调所有时段出价',
    category: 'market',
    method: 'POST',
    endpoint: '/api/tools/update_all_prices',
    dangerous: true,
    params: [
      {
        key: 'percent_change',
        label: '调整幅度 (%)',
        type: 'number',
        default: 10,
        placeholder: '正数上调，负数下调，如 10 表示 +10%',
        required: true,
      },
    ],
  },
  {
    id: 'update_price',
    name: '更新单小时出价',
    description: '精确修改某个时段的出价',
    category: 'market',
    method: 'POST',
    endpoint: '/api/tools/update_price',
    dangerous: true,
    params: [
      {
        key: 'hour',
        label: '时段 (0-23)',
        type: 'number',
        default: 14,
        placeholder: '0-23',
        required: true,
      },
      {
        key: 'price',
        label: '出价 (元/kWh)',
        type: 'number',
        default: 1.0,
        placeholder: '如 1.25',
        required: true,
      },
    ],
  },
  // ── Revenue ───────────────────────────────────────────────────────
  {
    id: 'revenue_summary',
    name: '收益结算汇总',
    description: '本月总收益、已结算/待结算金额',
    category: 'revenue',
    method: 'GET',
    endpoint: '/api/tools/revenue_summary',
  },
  // ── Theme ─────────────────────────────────────────────────────────
  {
    id: 'set_theme',
    name: '切换主题',
    description: '切换暗色/亮色模式及科技蓝/能源绿色调',
    category: 'theme',
    method: 'POST',
    endpoint: '/api/tools/set_theme',
    params: [
      {
        key: 'mode',
        label: '显示模式',
        type: 'select',
        options: ['', 'dark', 'light'],
        default: '',
      },
      {
        key: 'tone',
        label: '色调',
        type: 'select',
        options: ['', 'blue', 'green'],
        default: '',
      },
    ],
  },
  // ── Deploy ────────────────────────────────────────────────────────
  {
    id: 'deploy',
    name: '构建并部署',
    description: 'npm run build → git commit → git push → 触发 GitHub Actions',
    category: 'deploy',
    method: 'POST',
    endpoint: '/api/tools/deploy',
    critical: true,
    params: [
      {
        key: 'message',
        label: '提交信息（可选）',
        type: 'text',
        placeholder: '留空自动生成',
        required: false,
      },
    ],
  },
];
