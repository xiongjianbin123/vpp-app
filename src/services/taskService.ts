import api from './api';
import type { DemandResponseTask } from '../mock/data';
import { mockTasks } from '../mock/data';

export const getTasks = async (): Promise<DemandResponseTask[]> => {
  try {
    const res = await api.get<DemandResponseTask[]>('/tasks');
    return res.data;
  } catch {
    return mockTasks;
  }
};

export const createTask = async (task: Partial<DemandResponseTask>): Promise<DemandResponseTask> => {
  try {
    const res = await api.post<DemandResponseTask>('/tasks', task);
    return res.data;
  } catch {
    return {
      id: `T${String(Date.now()).slice(-4)}`,
      status: '待响应',
      progress: 0,
      ...task,
    } as DemandResponseTask;
  }
};

export const updateTask = async (id: string, task: Partial<DemandResponseTask>): Promise<DemandResponseTask> => {
  try {
    const res = await api.put<DemandResponseTask>(`/tasks/${id}`, task);
    return res.data;
  } catch {
    return { ...task, id } as DemandResponseTask;
  }
};
