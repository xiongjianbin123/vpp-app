import { mockTasks } from '../mock/data';
import type { DemandResponseTask } from '../mock/data';

export const getTasks = async (): Promise<DemandResponseTask[]> => mockTasks;
export const createTask = async (task: Partial<DemandResponseTask>): Promise<DemandResponseTask> => task as DemandResponseTask;
export const updateTask = async (_id: string, task: Partial<DemandResponseTask>): Promise<DemandResponseTask> => task as DemandResponseTask;
