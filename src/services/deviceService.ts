import api from './api';
import type { Device } from '../mock/data';

async function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

export const getDevices = () => unwrap<Device[]>(api.get('/devices'));
export const getDevice = (id: string) => unwrap<Device>(api.get(`/devices/${id}`));
export const createDevice = (device: Partial<Device>) => unwrap<Device>(api.post('/devices', device));
export const updateDevice = (id: string, device: Partial<Device>) => unwrap<Device>(api.put(`/devices/${id}`, device));
export const deleteDevice = (id: string) => api.delete(`/devices/${id}`);
