import { mockDevices } from '../mock/data';
import type { Device } from '../mock/data';

export const getDevices = async (): Promise<Device[]> => mockDevices;

export const getDevice = async (id: string): Promise<Device> => {
  const d = mockDevices.find(d => d.id === id);
  if (!d) throw new Error(`Device ${id} not found`);
  return d;
};

export const createDevice = async (device: Partial<Device>): Promise<Device> => device as Device;
export const updateDevice = async (_id: string, device: Partial<Device>): Promise<Device> => device as Device;
export const deleteDevice = async (_id: string): Promise<void> => {};
