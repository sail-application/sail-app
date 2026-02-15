/**
 * components/features/strategies/admin/ai-data-fields.tsx
 *
 * Client Component — collapsible editors for all AI coaching JSONB fields
 * on a methodology. Each field gets a JSON textarea with validation.
 * Key-value fields (vocabulary, feature_prompt_overrides) use the
 * KeyValueEditor component instead.
 */

'use client';

import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { KeyValueEditor } from './key-value-editor';

/* ── Types for the AI data props ── */
interface AiDataFieldsProps {
  featurePromptOverrides: Record<string, string>;
  setFeaturePromptOverrides: Dispatch<SetStateAction<Record<string, string>>>;
  vocabulary: Record<string, string>;
  setVocabulary: Dispatch<SetStateAction<Record<string, string>>>;
  scoringRubric: unknown[];
  setScoringRubric: Dispatch<SetStateAction<unknown[]>>;
  stages: unknown[];
  setStages: Dispatch<SetStateAction<unknown[]>>;
  questionTypes: unknown[];
  setQuestionTypes: Dispatch<SetStateAction<unknown[]>>;
  antiPatterns: unknown[];
  setAntiPatterns: Dispatch<SetStateAction<unknown[]>>;
  successSignals: unknown[];
  setSuccessSignals: Dispatch<SetStateAction<unknown[]>>;
  learningObjectives: unknown[];
  setLearningObjectives: Dispatch<SetStateAction<unknown[]>>;
  conceptChunks: unknown[];
  setConceptChunks: Dispatch<SetStateAction<unknown[]>>;
}

/* ── Collapsible JSON field ── */
interface JsonFieldProps {
  label: string;
  description: string;
  value: unknown;
  onChange: (val: unknown) => void;
}

function JsonField({ label, description, value, onChange }: JsonFieldProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleBlur = useCallback(() => {
    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, [text, onChange]);

  return (
    <div className="border border-foreground/10 rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-foreground/3"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="font-medium text-sm">{label}</span>
        <span className="text-xs text-foreground/40 ml-auto">
          {Array.isArray(value) ? `${(value as unknown[]).length} items` : 'object'}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-foreground/50">{description}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            className="w-full rounded-lg bg-white/5 border border-[var(--glass-border)] px-3 py-2 text-xs font-mono text-foreground min-h-[120px]"
            spellCheck={false}
          />
          {error && (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Collapsible key-value field ── */
interface KvFieldProps {
  label: string;
  description: string;
  value: Record<string, string>;
  onChange: Dispatch<SetStateAction<Record<string, string>>>;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

function KvField({ label, description, value, onChange, keyPlaceholder, valuePlaceholder }: KvFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-foreground/10 rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-foreground/3"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="font-medium text-sm">{label}</span>
        <span className="text-xs text-foreground/40 ml-auto">
          {Object.keys(value).length} entries
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-foreground/50">{description}</p>
          <KeyValueEditor
            label=""
            value={value}
            onChange={onChange}
            keyPlaceholder={keyPlaceholder}
            valuePlaceholder={valuePlaceholder}
          />
        </div>
      )}
    </div>
  );
}

/* ── Main export ── */
export function AiDataFields(props: AiDataFieldsProps) {
  return (
    <div className="space-y-2">
      <KvField
        label="Feature Prompt Overrides"
        description="Per-feature prompt overrides. Key = feature name (e.g. practice_mode), Value = prompt text."
        value={props.featurePromptOverrides}
        onChange={props.setFeaturePromptOverrides}
        keyPlaceholder="Feature name"
        valuePlaceholder="Prompt override text"
      />
      <KvField
        label="Vocabulary"
        description="Key terms and definitions specific to this methodology."
        value={props.vocabulary}
        onChange={props.setVocabulary}
        keyPlaceholder="Term"
        valuePlaceholder="Definition"
      />
      <JsonField
        label="Scoring Rubric"
        description="Weighted scoring dimensions for AI evaluation. Each entry needs key, name, description, weight, and anchors."
        value={props.scoringRubric}
        onChange={(v) => props.setScoringRubric(v as unknown[])}
      />
      <JsonField
        label="Stages"
        description="Ordered progression phases. Each needs key, name, order, description, signals, transition_cues, coaching_tips."
        value={props.stages}
        onChange={(v) => props.setStages(v as unknown[])}
      />
      <JsonField
        label="Question Types"
        description="Question taxonomy entries. Each needs key, name, description, purpose, examples, stage_affinity, difficulty."
        value={props.questionTypes}
        onChange={(v) => props.setQuestionTypes(v as unknown[])}
      />
      <JsonField
        label="Anti-Patterns"
        description="Common mistakes the AI should detect. Each needs name, description, detection_signals, coaching_response."
        value={props.antiPatterns}
        onChange={(v) => props.setAntiPatterns(v as unknown[])}
      />
      <JsonField
        label="Success Signals"
        description="Positive behaviors to reinforce. Each needs name, description, significance."
        value={props.successSignals}
        onChange={(v) => props.setSuccessSignals(v as unknown[])}
      />
      <JsonField
        label="Learning Objectives"
        description="Bloom's taxonomy-aligned objectives. Each needs statement, bloom_level, assessment_criteria."
        value={props.learningObjectives}
        onChange={(v) => props.setLearningObjectives(v as unknown[])}
      />
      <JsonField
        label="Concept Chunks"
        description="Micro-lesson chunks. Each needs id, title, type, content, estimated_minutes, prerequisite_chunks."
        value={props.conceptChunks}
        onChange={(v) => props.setConceptChunks(v as unknown[])}
      />
    </div>
  );
}
