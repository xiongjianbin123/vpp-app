import { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';
export type ThemeTone = 'blue' | 'green';

export interface ThemeColors {
  bgPage: string;
  bgSider: string;
  bgCard: string;
  bgElevated: string;
  primary: string;
  primaryMuted: string;
  primaryBorder: string;
  primaryBorderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;
  success: string;
  warning: string;
  danger: string;
  borderSubtle: string;
}

// Dark + Blue（科技蓝）
const darkBlueColors: ThemeColors = {
  bgPage: '#0a0e1a',
  bgSider: '#0d1526',
  bgCard: '#111827',
  bgElevated: '#1a2540',
  primary: '#00d4ff',
  primaryMuted: 'rgba(0, 212, 255, 0.08)',
  primaryBorder: 'rgba(0, 212, 255, 0.2)',
  primaryBorderLight: 'rgba(0, 212, 255, 0.15)',
  textPrimary: '#e2e8f0',
  textSecondary: '#aab4c8',
  textMuted: '#6b7280',
  textDim: '#4a6080',
  success: '#00ff88',
  warning: '#ffb800',
  danger: '#ff4d4d',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
};

// Dark + Green（能源绿）
const darkGreenColors: ThemeColors = {
  bgPage: '#080f0a',
  bgSider: '#0b1a0e',
  bgCard: '#0f1f13',
  bgElevated: '#162b1c',
  primary: '#00e676',
  primaryMuted: 'rgba(0, 230, 118, 0.08)',
  primaryBorder: 'rgba(0, 230, 118, 0.2)',
  primaryBorderLight: 'rgba(0, 230, 118, 0.15)',
  textPrimary: '#e2e8e4',
  textSecondary: '#a8c4ae',
  textMuted: '#6b7a6e',
  textDim: '#4a6b52',
  success: '#69ff47',
  warning: '#ffb800',
  danger: '#ff4d4d',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
};

// Light + Blue（明亮蓝）
const lightBlueColors: ThemeColors = {
  bgPage: '#f0f4f8',
  bgSider: '#ffffff',
  bgCard: '#ffffff',
  bgElevated: '#edf2f7',
  primary: '#1677ff',
  primaryMuted: 'rgba(22, 119, 255, 0.08)',
  primaryBorder: 'rgba(22, 119, 255, 0.25)',
  primaryBorderLight: 'rgba(22, 119, 255, 0.15)',
  textPrimary: '#1a202c',
  textSecondary: '#4a5568',
  textMuted: '#718096',
  textDim: '#a0aec0',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  borderSubtle: 'rgba(0, 0, 0, 0.06)',
};

// Light + Green（明亮绿）
const lightGreenColors: ThemeColors = {
  bgPage: '#f0f7f2',
  bgSider: '#ffffff',
  bgCard: '#ffffff',
  bgElevated: '#edf7f0',
  primary: '#16a34a',
  primaryMuted: 'rgba(22, 163, 74, 0.08)',
  primaryBorder: 'rgba(22, 163, 74, 0.25)',
  primaryBorderLight: 'rgba(22, 163, 74, 0.15)',
  textPrimary: '#1a2c1e',
  textSecondary: '#4a5e50',
  textMuted: '#718a75',
  textDim: '#a0b8a5',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  borderSubtle: 'rgba(0, 0, 0, 0.06)',
};

const colorMap: Record<ThemeMode, Record<ThemeTone, ThemeColors>> = {
  dark: { blue: darkBlueColors, green: darkGreenColors },
  light: { blue: lightBlueColors, green: lightGreenColors },
};

interface ThemeContextValue {
  mode: ThemeMode;
  tone: ThemeTone;
  colors: ThemeColors;
  toggleTheme: () => void;
  toggleTone: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  tone: 'blue',
  colors: darkBlueColors,
  toggleTheme: () => {},
  toggleTone: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('vpp_theme') as ThemeMode) ?? 'dark';
  });
  const [tone, setTone] = useState<ThemeTone>(() => {
    return (localStorage.getItem('vpp_tone') as ThemeTone) ?? 'blue';
  });

  const colors = colorMap[mode][tone];

  useEffect(() => {
    document.body.setAttribute('data-theme', mode);
    document.body.setAttribute('data-tone', tone);
    localStorage.setItem('vpp_theme', mode);
    localStorage.setItem('vpp_tone', tone);
  }, [mode, tone]);

  const toggleTheme = () => setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  const toggleTone = () => setTone(prev => (prev === 'blue' ? 'green' : 'blue'));

  return (
    <ThemeContext.Provider value={{ mode, tone, colors, toggleTheme, toggleTone }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
