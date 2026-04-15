import { callAgentAction } from './agentApi';

export interface WorkflowStep {
  title: string;
  agent?: string;
  description: string;
}

export interface WorkflowStepResult {
  step: string;
  status: 'running' | 'done' | 'error' | 'skipped';
  data?: unknown;
  error?: string;
}

export interface WorkflowContext {
  previousOutputs: Record<string, unknown>;
}

// Map agent key to its default action name
const agentActions: Record<string, string> = {
  'customer-profiler': 'search',
  'revenue-calculator': 'calculate',
  'finance-matcher': 'match',
  'contract-generator': 'generate',
  'ops-guardian': 'analyze',
  'market-intelligence': 'scan',
};

/**
 * Build params for a step using outputs from previous steps
 */
function buildStepParams(
  agentKey: string,
  initialParams: Record<string, unknown>,
  context: WorkflowContext,
): Record<string, unknown> {
  const params = { ...initialParams };

  // Revenue Calculator uses customer profiler's output
  if (agentKey === 'revenue-calculator' && context.previousOutputs['customer-profiler']) {
    params.customerAnalysis = JSON.stringify(context.previousOutputs['customer-profiler']);
  }

  // Finance Matcher uses revenue calculator's output
  if (agentKey === 'finance-matcher' && context.previousOutputs['revenue-calculator']) {
    params.revenueAnalysis = JSON.stringify(context.previousOutputs['revenue-calculator']);
  }

  // Contract Generator uses finance matcher's output
  if (agentKey === 'contract-generator' && context.previousOutputs['finance-matcher']) {
    params.financingPlan = JSON.stringify(context.previousOutputs['finance-matcher']);
  }

  return params;
}

/**
 * Run a workflow step by step, yielding results as they complete
 */
export async function* runWorkflow(
  steps: WorkflowStep[],
  initialParams: Record<string, unknown>,
): AsyncGenerator<WorkflowStepResult> {
  const context: WorkflowContext = { previousOutputs: {} };

  for (const step of steps) {
    if (!step.agent || !agentActions[step.agent]) {
      yield { step: step.title, status: 'skipped' };
      continue;
    }

    yield { step: step.title, status: 'running' };

    const params = buildStepParams(step.agent, initialParams, context);
    const action = agentActions[step.agent];

    try {
      const result = await callAgentAction(step.agent, action, params);

      if (result.success && result.data) {
        context.previousOutputs[step.agent] = result.data;
        yield { step: step.title, status: 'done', data: result.data };
      } else {
        yield { step: step.title, status: 'error', error: result.error || 'Agent action failed' };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      yield { step: step.title, status: 'error', error: errMsg };
    }
  }
}
