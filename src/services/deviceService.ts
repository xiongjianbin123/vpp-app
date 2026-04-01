import api from './api';
import type { Device } from '../mock/data';
import { mockDevices } from '../mock/data';

export const getDevices = async (): Promise<Device[]> => {
  try {
    const res = await api.get<Device[]>('/devices');
    return res.data;
  } catch {
    // 后端未运行时使用 mock 数据
    return mockDevices;
  }
};

export const getDevice = async (id: string): Promise<Device> => {
  try {
    const res = await api.get<Device>(`/devices/${id}`);
    return res.data;
  } catch {
    const found = mockDevices.find(d => d.id === id);
    if (found) return found;
    throw new Error('Device not found');
  }
};

export const createDevice = async (device: Partial<Device>): Promise<Device> => {
  try {
    const res = await api.post<Device>('/devices', device);
    return res.data;
  } catch {
    return device as Device;
  }
};

export const updateDevice = async (id: string, device: Partial<Device>): Promise<Device> => {
  try {
    const res = await api.put<Device>(`/devices/${id}`, device);
    return res.data;
  } catch {
    return { ...device, id } as Device;
  }
};

export const deleteDevice = async (id: string): Promise<void> => {
  try {
    await api.delete(`/devices/${id}`);
  } catch {
    // mock mode: no-op
  }
};
