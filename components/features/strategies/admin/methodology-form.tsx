/**
 * components/features/strategies/admin/methodology-form.tsx
 *
 * Client Component — create/edit form for a methodology.
 * Handles display fields, media (videos/books), tags, and AI coaching data.
 * AI coaching fields are managed by the AiDataFields sub-component.
 */

'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { VideoFields } from './video-fields';
import { BookFields } from './book-fields';
import { TagInput } from './tag-input';
import { SelectField, TextareaField } from './form-fields';
import { AiDataFields } from './ai-data-fields';
import type { Methodology, MethodologyVideo, MethodologyBook } from '@/types/methodology';

interface MethodologyFormProps {
  /** Existing methodology data for edit mode, null for create */
  methodology: Methodology | null;
}

/** Auto-generate slug from name */
function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function MethodologyForm({ methodology }: MethodologyFormProps) {
  const router = useRouter();
  const isEdit = !!methodology;

  /* ── Basic form state ── */
  const [name, setName] = useState(methodology?.name ?? '');
  const [slug, setSlug] = useState(methodology?.slug ?? '');
  const [author, setAuthor] = useState(methodology?.author ?? '');
  const [tagline, setTagline] = useState(methodology?.tagline ?? '');
  const [description, setDescription] = useState(methodology?.description ?? '');
  const [howItWorks, setHowItWorks] = useState(methodology?.how_it_works ?? '');
  const [bestFor, setBestFor] = useState(methodology?.best_for ?? '');
  const [icon, setIcon] = useState(methodology?.icon ?? 'book-open');
  const [category, setCategory] = useState(methodology?.category ?? 'framework');
  const [complexity, setComplexity] = useState(methodology?.complexity_level ?? 'intermediate');
  const [relevance, setRelevance] = useState(methodology?.relevance_rating ?? 3);
  const [accessTier, setAccessTier] = useState(methodology?.access_tier ?? 'pro');
  const [sortOrder, setSortOrder] = useState(methodology?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(methodology?.is_active ?? true);
  const [trademark, setTrademark] = useState(methodology?.trademark_attribution ?? '');
  const [tags, setTags] = useState<string[]>(methodology?.tags ?? []);
  const [videos, setVideos] = useState<MethodologyVideo[]>(methodology?.videos ?? []);
  const [books, setBooks] = useState<MethodologyBook[]>(methodology?.books ?? []);
  const [systemPrompt, setSystemPrompt] = useState(methodology?.system_prompt_template ?? '');

  /* ── AI coaching data state ── */
  const [featurePromptOverrides, setFeaturePromptOverrides] = useState<Record<string, string>>(
    methodology?.feature_prompt_overrides ?? {},
  );
  const [vocabulary, setVocabulary] = useState<Record<string, string>>(
    methodology?.vocabulary ?? {},
  );
  const [scoringRubric, setScoringRubric] = useState<unknown[]>(
    methodology?.scoring_rubric ?? [],
  );
  const [stages, setStages] = useState<unknown[]>(methodology?.stages ?? []);
  const [questionTypes, setQuestionTypes] = useState<unknown[]>(
    methodology?.question_types ?? [],
  );
  const [antiPatterns, setAntiPatterns] = useState<unknown[]>(
    methodology?.anti_patterns ?? [],
  );
  const [successSignals, setSuccessSignals] = useState<unknown[]>(
    methodology?.success_signals ?? [],
  );
  const [learningObjectives, setLearningObjectives] = useState<unknown[]>(
    methodology?.learning_objectives ?? [],
  );
  const [conceptChunks, setConceptChunks] = useState<unknown[]>(
    methodology?.concept_chunks ?? [],
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Auto-slug when name changes (only in create mode) */
  function handleNameChange(val: string) {
    setName(val);
    if (!isEdit) setSlug(toSlug(val));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      name, slug, author, tagline: tagline || undefined,
      description, how_it_works: howItWorks || undefined,
      best_for: bestFor || undefined, icon, category,
      complexity_level: complexity, relevance_rating: relevance,
      access_tier: accessTier, sort_order: sortOrder,
      is_active: isActive, trademark_attribution: trademark || undefined,
      tags, videos, books,
      system_prompt_template: systemPrompt || undefined,
      feature_prompt_overrides: featurePromptOverrides,
      vocabulary, scoring_rubric: scoringRubric,
      stages, question_types: questionTypes,
      anti_patterns: antiPatterns, success_signals: successSignals,
      learning_objectives: learningObjectives, concept_chunks: conceptChunks,
    };

    try {
      const url = isEdit
        ? `/api/admin/methodologies/${methodology.id}`
        : '/api/admin/methodologies';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }
      router.push('/admin/strategies');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Core fields */}
      <GlassPanel className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Basic Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
          <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          <Input label="Author" value={author} onChange={(e) => setAuthor(e.target.value)} required />
          <Input label="Icon (Lucide)" value={icon} onChange={(e) => setIcon(e.target.value)} />
        </div>
        <Input label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-[var(--glass-border)] px-4 py-2 text-sm text-foreground min-h-[80px]"
            required />
        </div>
      </GlassPanel>

      {/* Classification */}
      <GlassPanel className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Classification</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SelectField label="Category" value={category} onChange={setCategory}
            options={['questioning', 'framework', 'process', 'mindset']} />
          <SelectField label="Complexity" value={complexity} onChange={setComplexity}
            options={['beginner', 'intermediate', 'advanced']} />
          <SelectField label="Access Tier" value={accessTier} onChange={setAccessTier}
            options={['free', 'pro', 'team']} />
          <Input label="Relevance (1-5)" type="number" min={1} max={5}
            value={relevance} onChange={(e) => setRelevance(parseInt(e.target.value) || 3)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Sort Order" type="number" value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} />
          <div className="flex items-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                className="rounded" />
              Active
            </label>
          </div>
        </div>
        <Input label="Trademark Attribution" value={trademark}
          onChange={(e) => setTrademark(e.target.value)} placeholder="e.g. SPIN Selling® is a registered trademark…" />
        <TagInput value={tags} onChange={setTags} label="Tags" />
      </GlassPanel>

      {/* Content sections */}
      <GlassPanel className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Content</h3>
        <TextareaField label="How It Works" value={howItWorks} onChange={setHowItWorks} />
        <TextareaField label="Best For" value={bestFor} onChange={setBestFor} />
        <TextareaField label="System Prompt Template" value={systemPrompt} onChange={setSystemPrompt}
          placeholder="AI system prompt for this methodology…" rows={6} />
      </GlassPanel>

      {/* AI Coaching Data */}
      <GlassPanel className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">AI Coaching Data</h3>
        <p className="text-xs text-foreground/50">
          Structured data that powers AI coaching features. Expand each section to edit.
        </p>
        <AiDataFields
          featurePromptOverrides={featurePromptOverrides}
          setFeaturePromptOverrides={setFeaturePromptOverrides}
          vocabulary={vocabulary}
          setVocabulary={setVocabulary}
          scoringRubric={scoringRubric}
          setScoringRubric={setScoringRubric}
          stages={stages}
          setStages={setStages}
          questionTypes={questionTypes}
          setQuestionTypes={setQuestionTypes}
          antiPatterns={antiPatterns}
          setAntiPatterns={setAntiPatterns}
          successSignals={successSignals}
          setSuccessSignals={setSuccessSignals}
          learningObjectives={learningObjectives}
          setLearningObjectives={setLearningObjectives}
          conceptChunks={conceptChunks}
          setConceptChunks={setConceptChunks}
        />
      </GlassPanel>

      {/* Media */}
      <GlassPanel className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Media</h3>
        <VideoFields value={videos} onChange={setVideos} />
        <BookFields value={books} onChange={setBooks} />
      </GlassPanel>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" isLoading={saving}>{isEdit ? 'Save Changes' : 'Create Methodology'}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
