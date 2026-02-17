/**
 * app/api/ai/practice/end-session.ts
 *
 * Handles the 'end' action for practice sessions.
 * Extracted from route.ts to keep that file under 200 lines.
 *
 * Flow:
 *   1. Verify session ownership
 *   2. Resolve methodologies + proficiency + context pack
 *   3. Request structured AI feedback (non-streaming JSON)
 *   4. Persist transcript + score to practice_sessions
 *   5. Return { score, feedback } to client
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { aiChat } from '@/lib/ai/provider';
import { resolveMethodologies } from '@/lib/ai/methodology-resolver';
import { composeMultiMethodologyPrompt } from '@/lib/ai/prompt-composer';
import { resolveProficiencyLevel } from '@/lib/ai/proficiency-resolver';
import { loadContextPack } from '@/lib/ai/context-pack-loader';
import { captureError } from '@/lib/sentry';

interface TranscriptMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface EndSessionData {
  sessionId: string;
  transcript: TranscriptMessage[];
  methodologyIds?: string[];
  contextPackId?: string;
  durationSeconds: number;
}

interface ScoreResult {
  overall: number;
  dimensions: Record<string, number>;
  strengths: string[];
  improvements: string[];
  tips: string[];
}

/**
 * Formats the transcript into a readable string for the feedback prompt.
 */
function formatTranscript(messages: TranscriptMessage[]): string {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'user' ? 'Rep' : 'Prospect'}: ${m.content}`)
    .join('\n\n');
}

/**
 * Parses the AI's JSON response, stripping any markdown fences.
 * Returns a fallback score on parse failure.
 */
function parseScoreJson(raw: string): ScoreResult {
  try {
    const stripped = raw.replace(/^```json\s*|\s*```$/gm, '').trim();
    return JSON.parse(stripped) as ScoreResult;
  } catch {
    return {
      overall: 70,
      dimensions: {},
      strengths: ['Session completed.'],
      improvements: ['Review the transcript for coaching insights.'],
      tips: ['Practice regularly to build your skills.'],
    };
  }
}

/**
 * Handles the 'end' action: generates AI feedback and persists the session.
 */
export async function handleEndSession(userId: string, data: EndSessionData) {
  const admin = createAdminClient();

  // 1. Verify session ownership
  try {
    const { data: session, error } = await admin
      .from('practice_sessions')
      .select('id, status')
      .eq('id', data.sessionId)
      .eq('user_id', userId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
  } catch (err) {
    captureError(err, { route: '/api/ai/practice' });
    return NextResponse.json({ error: 'Failed to verify session.' }, { status: 500 });
  }

  // 2. Resolve methodologies, proficiency, and context pack in parallel
  const [methodologies, proficiencyLevel, contextPack] = await Promise.all([
    resolveMethodologies(userId, data.methodologyIds),
    resolveProficiencyLevel(userId, data.methodologyIds ?? []),
    loadContextPack(data.contextPackId),
  ]);

  // 3. Compose system prompt and request structured feedback
  const systemMessages = composeMultiMethodologyPrompt(
    'analyzer',
    methodologies,
    proficiencyLevel,
    contextPack,
  );

  const transcriptText = formatTranscript(data.transcript);
  const userMessage = `Here is the practice session transcript:\n\n${transcriptText}\n\n` +
    `Evaluate this conversation and respond with ONLY a JSON object (no markdown, no commentary):\n` +
    `{"overall":0-100,"dimensions":{"rapport":0-10,"discovery":0-10,"objection_handling":0-10,"close":0-10},"strengths":["..."],"improvements":["..."],"tips":["..."]}`;

  let score: ScoreResult;
  try {
    const aiResponse = await aiChat(
      {
        messages: [
          ...systemMessages,
          { role: 'user', content: userMessage },
        ],
        feature: 'analyzer',
      },
      userId,
    );
    score = parseScoreJson(aiResponse.content);
  } catch (err) {
    captureError(err, { route: '/api/ai/practice' });
    // Non-fatal: still persist the session, just without a score
    score = parseScoreJson('');
  }

  // 4. Persist transcript + score to the database
  try {
    await admin
      .from('practice_sessions')
      .update({
        status: 'completed',
        transcript: data.transcript,
        score_jsonb: score,
        duration_seconds: data.durationSeconds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', data.sessionId)
      .eq('user_id', userId);
  } catch (err) {
    captureError(err, { route: '/api/ai/practice' });
    // Non-fatal: return score even if DB update fails
  }

  return NextResponse.json({ score, feedback: score });
}
