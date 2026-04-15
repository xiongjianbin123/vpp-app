import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { query } from '../config/database';
import { getAIConfig } from '../config/ai';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ---------- SSE Chat ----------
router.post('/chat', async (req: Request, res: Response) => {
  const { messages, systemPrompt } = req.body;
  const config = getAIConfig();

  if (!config.apiKey) {
    res.status(500).json({ error: 'AI API key not configured on server' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    if (config.provider === 'anthropic') {
      const client = new Anthropic({ apiKey: config.apiKey });
      const stream = client.messages.stream({
        model: config.model,
        max_tokens: config.maxTokens,
        system: systemPrompt,
        messages,
      });
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ delta: chunk.delta.text })}\n\n`);
        }
      }
    } else {
      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
      const stream = await client.chat.completions.create({
        model: config.model,
        max_tokens: config.maxTokens,
        stream: true,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        }
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'LLM error';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// ---------- Structured Action ----------
router.post('/action', async (req: Request, res: Response) => {
  const { agentKey, action, params, dataId } = req.body;
  const config = getAIConfig();

  if (!config.apiKey) {
    res.status(500).json({ success: false, error: 'AI API key not configured' });
    return;
  }

  // Build structured prompt
  let contextData = '';
  if (dataId) {
    const rows = await query<{ parsed_data: unknown }>(
      'SELECT parsed_data FROM agent_uploads WHERE id = $1',
      [dataId],
    );
    if (rows.length > 0) {
      const data = rows[0].parsed_data;
      contextData = `\n\nUser uploaded data (showing first 100 rows):\n${JSON.stringify(Array.isArray(data) ? data.slice(0, 100) : data)}`;
    }
  }

  const actionPrompt = `You are an AI agent for a Virtual Power Plant management system.
Agent: ${agentKey}, Action: ${action}
User parameters: ${JSON.stringify(params)}
${contextData}

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no explanation, no code fences. Just the raw JSON object.
The response should be a JSON object with a "data" key containing the analysis results.`;

  try {
    let responseText = '';

    if (config.provider === 'anthropic') {
      const client = new Anthropic({ apiKey: config.apiKey });
      const response = await client.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        system: actionPrompt,
        messages: [{ role: 'user', content: `Execute ${action} with the given parameters` }],
      });
      responseText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
    } else {
      const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
      const response = await client.chat.completions.create({
        model: config.model,
        max_tokens: config.maxTokens,
        messages: [
          { role: 'system', content: actionPrompt },
          { role: 'user', content: `Execute ${action} with the given parameters` },
        ],
      });
      responseText = response.choices[0]?.message?.content || '';
    }

    // Try to parse JSON - handle markdown code fences
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    res.json({ success: true, data: parsed.data || parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process action';
    res.json({ success: false, error: message });
  }
});

// ---------- Chat History ----------
router.get('/chat-history/:agentKey', async (req: Request, res: Response) => {
  const { agentKey } = req.params;
  const userId = (req as unknown as { user: { userId: number } }).user?.userId;

  const rows = await query<{ messages: unknown }>(
    'SELECT messages FROM agent_chat_history WHERE user_id = $1 AND agent_key = $2',
    [userId, agentKey],
  );

  res.json({ messages: rows.length > 0 ? rows[0].messages : [] });
});

router.post('/chat-history/:agentKey', async (req: Request, res: Response) => {
  const { agentKey } = req.params;
  const { messages } = req.body;
  const userId = (req as unknown as { user: { userId: number } }).user?.userId;

  await query(
    `INSERT INTO agent_chat_history (user_id, agent_key, messages)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, agent_key)
     DO UPDATE SET messages = $3, updated_at = NOW()`,
    [userId, agentKey, JSON.stringify(messages)],
  );

  res.json({ success: true });
});

router.delete('/chat-history/:agentKey', async (req: Request, res: Response) => {
  const { agentKey } = req.params;
  const userId = (req as unknown as { user: { userId: number } }).user?.userId;

  await query(
    'DELETE FROM agent_chat_history WHERE user_id = $1 AND agent_key = $2',
    [userId, agentKey],
  );

  res.status(204).end();
});

// ---------- File Upload ----------
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  const { agentKey } = req.body;
  const userId = (req as unknown as { user: { userId: number } }).user?.userId;

  if (!file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }

  try {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    const columns = jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [];

    const dataId = crypto.randomUUID();

    await query(
      `INSERT INTO agent_uploads (id, user_id, agent_key, file_name, parsed_data, row_count, columns)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [dataId, userId, agentKey, file.originalname, JSON.stringify(jsonData), jsonData.length, JSON.stringify(columns)],
    );

    res.json({
      success: true,
      dataId,
      fileName: file.originalname,
      rowCount: jsonData.length,
      columns,
      preview: jsonData.slice(0, 5),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse file';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
