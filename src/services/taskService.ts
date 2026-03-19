import api from './api';
import type { DemandResponseTask } from '../mock/data';

async function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

export const getTasks = () => unwrap<DemandResponseTask[]>(api.get('/tasks'));
export const createTask = (task: Partial<DemandResponseTask>) => unwrap<DemandResponseTask>(api.post('/tasks', task));
export const updateTask = (id: string, task: Partial<DemandResponseTask>) =>
  unwrap<DemandResponseTask>(api.put(`/tasks/${id}`, task));
