/**
 * components/features/strategies/ai-data-panel.tsx
 *
 * Admin-only panel showing raw AI coaching data for a methodology.
 * Displays: system prompt, feature overrides, scoring rubric, stages,
 * question types, vocabulary, anti-patterns, and success signals.
 */

import { GlassPanel } from '@/components/ui/glass-panel';
import type { Methodology } from '@/types/methodology';

interface AiDataPanelProps {
  methodology: Methodology;
}

export function AiDataPanel({ methodology: m }: AiDataPanelProps) {
  return (
    <div className="space-y-4">
      {/* System Prompt Template */}
      <Section title="System Prompt Template">
        {m.system_prompt_template ? (
          <pre className="text-xs text-foreground/80 whitespace-pre-wrap break-words bg-foreground/5 p-3 rounded-lg max-h-96 overflow-y-auto">
            {m.system_prompt_template}
          </pre>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Feature Prompt Overrides */}
      <Section title="Feature Prompt Overrides">
        {Object.keys(m.feature_prompt_overrides ?? {}).length > 0 ? (
          <KeyValueTable data={m.feature_prompt_overrides} />
        ) : (
          <Empty />
        )}
      </Section>

      {/* Scoring Rubric */}
      <Section title="Scoring Rubric">
        {(m.scoring_rubric ?? []).length > 0 ? (
          <div className="space-y-3">
            {m.scoring_rubric.map((dim) => (
              <div key={dim.key} className="p-3 rounded-lg bg-foreground/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{dim.name}</span>
                  <span className="text-xs text-foreground/50">
                    weight: {dim.weight}
                  </span>
                </div>
                <p className="text-xs text-foreground/70 mb-2">{dim.description}</p>
                {Object.keys(dim.anchors ?? {}).length > 0 && (
                  <KeyValueTable data={dim.anchors} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Stages */}
      <Section title="Stages">
        {(m.stages ?? []).length > 0 ? (
          <div className="space-y-3">
            {m.stages
              .sort((a, b) => a.order - b.order)
              .map((stage) => (
                <div key={stage.key} className="p-3 rounded-lg bg-foreground/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {stage.order}. {stage.name}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70 mb-2">{stage.description}</p>
                  <StringList label="Signals" items={stage.signals} />
                  <StringList label="Transition Cues" items={stage.transition_cues} />
                  <StringList label="Coaching Tips" items={stage.coaching_tips} />
                </div>
              ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Question Types */}
      <Section title="Question Types">
        {(m.question_types ?? []).length > 0 ? (
          <div className="space-y-3">
            {m.question_types.map((qt) => (
              <div key={qt.key} className="p-3 rounded-lg bg-foreground/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{qt.name}</span>
                  <span className="text-xs text-foreground/50 capitalize">
                    {qt.difficulty}
                  </span>
                </div>
                <p className="text-xs text-foreground/70 mb-1">{qt.description}</p>
                <p className="text-xs text-foreground/60 italic mb-2">{qt.purpose}</p>
                <StringList label="Examples" items={qt.examples} />
                <StringList label="Stage Affinity" items={qt.stage_affinity} />
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Vocabulary */}
      <Section title="Vocabulary">
        {Object.keys(m.vocabulary ?? {}).length > 0 ? (
          <KeyValueTable data={m.vocabulary} />
        ) : (
          <Empty />
        )}
      </Section>

      {/* Anti-Patterns */}
      <Section title="Anti-Patterns">
        {(m.anti_patterns ?? []).length > 0 ? (
          <div className="space-y-3">
            {m.anti_patterns.map((ap) => (
              <div key={ap.name} className="p-3 rounded-lg bg-foreground/5">
                <span className="font-semibold text-sm">{ap.name}</span>
                <p className="text-xs text-foreground/70 mt-1">{ap.description}</p>
                <StringList label="Detection Signals" items={ap.detection_signals} />
                <p className="text-xs text-foreground/60 mt-1">
                  <strong>Coaching Response:</strong> {ap.coaching_response}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Success Signals */}
      <Section title="Success Signals">
        {(m.success_signals ?? []).length > 0 ? (
          <div className="space-y-2">
            {m.success_signals.map((ss) => (
              <div key={ss.name} className="p-3 rounded-lg bg-foreground/5">
                <span className="font-semibold text-sm">{ss.name}</span>
                <p className="text-xs text-foreground/70 mt-1">{ss.description}</p>
                <p className="text-xs text-foreground/50 mt-1">
                  Significance: {ss.significance}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>
    </div>
  );
}

/* ── Helper sub-components ── */

/** Section wrapper with title */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassPanel blur="light" className="p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </GlassPanel>
  );
}

/** Key-value table for Record<string, string> data */
function KeyValueTable({ data }: { data: Record<string, string> }) {
  return (
    <table className="w-full text-xs">
      <tbody>
        {Object.entries(data).map(([key, val]) => (
          <tr key={key} className="border-b border-foreground/5 last:border-0">
            <td className="py-1 pr-3 font-medium text-foreground/70 align-top w-1/3">
              {key}
            </td>
            <td className="py-1 text-foreground/60">{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Inline list of strings with a label */
function StringList({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-1">
      <span className="text-xs font-medium text-foreground/60">{label}: </span>
      <span className="text-xs text-foreground/50">{items.join(' | ')}</span>
    </div>
  );
}

/** Placeholder for empty data */
function Empty() {
  return <p className="text-xs text-foreground/40 italic">No data configured.</p>;
}
