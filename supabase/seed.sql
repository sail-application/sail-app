-- ============================================================================
-- Seed Data for SAIL — Sales AI Learning Platform
-- Purpose: Populate the database with initial data for development and testing.
--
-- This seed file is idempotent — it uses ON CONFLICT DO NOTHING so it can
-- be run multiple times without creating duplicates.
--
-- Run with: npx supabase db reset (applies migrations + seed)
-- ============================================================================

-- ============================================================================
-- 1. Authorized Members — Skool community whitelist
-- ============================================================================
-- Add the primary admin (Alex, SA Picture Day owner) to the whitelist
INSERT INTO authorized_members (email, skool_username, is_active) VALUES
  ('alex@sapicture.day', 'AlexSAPictureDay', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 2. Strategies — Paul Cherry "Questions That Sell" methodology content
-- ============================================================================
-- These are the core sales techniques that SAIL teaches users

INSERT INTO strategies (title, category, description, content, prompt_type, examples, tags, sort_order, is_active) VALUES

  -- Strategy 1: Lock-On Questions
  (
    'Lock-On Questions',
    'questioning',
    'Build on the prospect''s own words to deepen the conversation and show active listening.',
    'Lock-On Questions are a powerful technique from Paul Cherry''s "Questions That Sell." The idea is simple: take something the prospect just said and build your next question around their exact words. This shows you''re actively listening and creates a natural conversational flow.

Instead of jumping to your next planned question, you "lock on" to a keyword or phrase the prospect used and ask them to elaborate. This builds trust, uncovers deeper needs, and makes the prospect feel heard.

How to use it:
1. Listen carefully to the prospect''s response
2. Identify a key word or phrase they used
3. Repeat that word/phrase and ask them to expand on it
4. Let the conversation flow naturally from their answer',
    'discovery',
    '[{"scenario": "Prospect says: We''ve been struggling with parent communication around picture day.", "question": "You mentioned ''struggling with parent communication'' — can you walk me through what that looks like on a typical picture day?", "why": "Locks onto their exact pain point and asks them to paint a vivid picture of the problem."},{"scenario": "Prospect says: We tried another photographer but it didn''t work out.", "question": "When you say it ''didn''t work out,'' what specifically fell short of your expectations?", "why": "Locks onto the vague phrase to uncover specific pain points with the competitor."}]',
    ARRAY['discovery', 'active-listening', 'paul-cherry', 'rapport'],
    1,
    true
  ),

  -- Strategy 2: Impact Questions
  (
    'Impact Questions',
    'questioning',
    'Help prospects quantify the cost of their current problem to create urgency.',
    'Impact Questions help the prospect understand the real cost of NOT solving their problem. Most prospects know they have a pain point, but they haven''t quantified what it''s costing them in time, money, reputation, or stress.

By asking impact questions, you help them connect their problem to tangible consequences. This creates urgency and moves them from "Sure" (open but uncommitted) to "Want To" (actively seeking a solution).

The key formula is: "What happens when [their problem] continues?"

Types of impact:
- Financial: "How much revenue are you leaving on the table?"
- Time: "How many hours does your staff spend on this each event?"
- Reputation: "How does this affect how parents perceive your studio?"
- Emotional: "How does this impact your team''s morale during events?"',
    'discovery',
    '[{"scenario": "Prospect mentions disorganized picture days.", "question": "When picture day runs behind schedule, how does that ripple out to the rest of your event day?", "why": "Helps them see the cascading impact of disorganization beyond just the photo session."},{"scenario": "Prospect mentions low photo sales.", "question": "If you could capture even 20% more sales per event, what would that mean for your annual revenue?", "why": "Puts a concrete number on the opportunity cost to create urgency."}]',
    ARRAY['discovery', 'urgency', 'paul-cherry', 'value-selling'],
    2,
    true
  ),

  -- Strategy 3: Expansion Questions
  (
    'Expansion Questions',
    'questioning',
    'Broaden the conversation to uncover needs the prospect hasn''t considered yet.',
    'Expansion Questions take a narrow topic and open it up to explore adjacent needs, stakeholders, or opportunities the prospect may not have considered. This technique helps you:

1. Discover additional pain points beyond the obvious one
2. Identify other decision-makers or influencers
3. Uncover future needs that create long-term partnership opportunities
4. Position yourself as a strategic partner, not just a vendor

The key is to move from the specific issue they raised to the broader context around it. Think of it as zooming out from the detail to see the full picture.

Formula: "Beyond [specific topic], how does this affect [broader area]?"',
    'discovery',
    '[{"scenario": "Prospect is focused on picture day logistics.", "question": "Beyond picture day itself, are there other events throughout the year where professional photography could add value — recitals, competitions, graduations?", "why": "Expands from a single event to year-round opportunity, increasing deal size."},{"scenario": "Prospect mentions they handle ordering themselves.", "question": "When you think about the full process — from scheduling through delivery — which parts take the most of your team''s time?", "why": "Expands the conversation to uncover pain points across the entire workflow."}]',
    ARRAY['discovery', 'upselling', 'paul-cherry', 'strategic'],
    3,
    true
  ),

  -- Strategy 4: Comparison Questions
  (
    'Comparison Questions',
    'questioning',
    'Use comparisons to help prospects evaluate their situation and your solution objectively.',
    'Comparison Questions help prospects evaluate where they are versus where they could be. By asking them to compare their current state to an ideal state (or to what others are doing), you create a gap that your solution can fill.

This technique is especially powerful when prospects think their current situation is "fine" or "good enough." By getting them to articulate the difference between current and ideal, they often talk themselves into wanting change.

Three types of comparison questions:
1. Current vs. Ideal: "How does your current process compare to what you''d ideally want?"
2. Before vs. After: "How did things change after you started doing X?"
3. You vs. Others: "What have you seen other studios in the area doing for their picture days?"

Important: Never make the comparison feel like a judgment. Frame it as curiosity.',
    'discovery',
    '[{"scenario": "Prospect seems satisfied with current photographer.", "question": "If you could design the perfect picture day experience from scratch, what would it look like compared to how things run now?", "why": "Gets them to articulate gaps without directly criticizing their current setup."},{"scenario": "Prospect is comparing your pricing to a competitor.", "question": "When you compare the full experience — setup, session flow, ordering, delivery — how do the two options stack up beyond just the price?", "why": "Shifts the comparison from price-only to total value, where you can differentiate."}]',
    ARRAY['discovery', 'competitive', 'paul-cherry', 'value-selling'],
    4,
    true
  ),

  -- Strategy 5: Vision Questions
  (
    'Vision Questions',
    'questioning',
    'Help prospects envision a better future state to drive commitment.',
    'Vision Questions help the prospect paint a picture of their ideal future state — with your solution in place. This moves them from "Want To" to "Have To" by making the desired outcome feel tangible and achievable.

When a prospect can clearly see and describe their better future, they become emotionally invested in making it happen. Vision questions tap into aspiration and forward momentum.

The key formula: "Imagine if [desired outcome] — what would that mean for [their priority]?"

When to use vision questions:
- After you''ve established pain points (impact questions)
- When the prospect is on the fence
- When you need to re-engage a stalled conversation
- During the closing phase to reinforce the decision

Vision questions work best when they''re specific to what the prospect has already told you they care about.',
    'closing',
    '[{"scenario": "Prospect has described chaotic picture days.", "question": "Imagine if picture day ran so smoothly that parents were actually excited about it and your team could focus on the event instead of logistics — what would that free up for you?", "why": "Paints a vivid picture of the solution while connecting to their specific pain points."},{"scenario": "Prospect is concerned about parent satisfaction.", "question": "If every parent received a beautifully curated gallery within 48 hours of the event, how do you think that would change their perception of your studio?", "why": "Helps them envision a specific, desirable outcome tied to their stated concern."}]',
    ARRAY['closing', 'commitment', 'paul-cherry', 'vision', 'aspiration'],
    5,
    true
  ),

  -- Strategy 6: The Sure → Want To → Have To Framework
  (
    'Sure → Want To → Have To Framework',
    'framework',
    'Paul Cherry''s commitment progression model — guide prospects through three stages of buying readiness.',
    'The "Sure → Want To → Have To" framework is the backbone of Paul Cherry''s sales methodology. Every prospect moves through three stages of commitment:

**SURE Stage** — "I''m open to hearing more"
- The prospect is polite and willing to talk, but not invested
- They''re giving you "sure" answers without real engagement
- Your goal: Ask discovery questions to uncover real pain points
- Danger: Staying here too long means you''re just a friendly chat

**WANT TO Stage** — "I can see how this would help"
- The prospect has connected their pain to your solution
- They''re asking questions, showing genuine interest
- Your goal: Use impact questions to quantify the cost of inaction
- Danger: They may "want to" forever without committing

**HAVE TO Stage** — "I need to make this happen"
- The prospect feels urgency — the cost of waiting outweighs the effort of changing
- They''re asking about next steps, pricing, timelines
- Your goal: Make it easy to say yes — remove friction, provide clear next steps
- Danger: Don''t oversell once they''re here — just close

How to move prospects through the stages:
- Sure → Want To: Lock-On + Impact Questions (uncover and quantify pain)
- Want To → Have To: Expansion + Vision Questions (broaden impact, paint the future)
- Have To → Close: Clear proposal, easy onboarding, reduce risk',
    'framework',
    '[{"scenario": "Prospect is in the SURE stage — polite but not engaged.", "question": "What prompted you to take this meeting today? What''s changed recently?", "why": "Uncovers the trigger event that made them open to talking — moves from polite to purposeful."},{"scenario": "Prospect is in the WANT TO stage — interested but not committing.", "question": "What would need to be true for you to feel confident moving forward with this before your next event?", "why": "Identifies the specific conditions needed for commitment and creates a timeline."}]',
    ARRAY['framework', 'paul-cherry', 'commitment', 'sales-process', 'methodology'],
    0,
    true
  )

ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. Feature Flags — Default flags (all disabled)
-- ============================================================================
-- These are seeded in the migration (20260213000014) via ON CONFLICT DO NOTHING,
-- but we include them here as well for completeness when using `db reset`.

INSERT INTO feature_flags (key, description, is_enabled) VALUES
  ('voice_practice',     'Enable voice-based practice mode with speech-to-text',              false),
  ('timed_mode',         'Enable timed practice sessions with countdown timer',               false),
  ('confidence_meter',   'Show real-time confidence meter during practice sessions',           false),
  ('expert_comparison',  'Allow users to compare their responses with expert examples',        false),
  ('custom_scenarios',   'Allow users to create custom practice scenarios',                    false),
  ('maintenance_mode',   'Put the entire app into maintenance mode (shows maintenance page)',   false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 4. AI Provider Config — Default provider settings
-- ============================================================================
-- These are seeded in the migration (20260213000005) via ON CONFLICT DO NOTHING,
-- but we include them here as well for completeness when using `db reset`.

INSERT INTO ai_provider_config (feature, provider, model, max_tokens, temperature) VALUES
  ('live-call',   'gemini', 'gemini-2.0-flash', 1024,  0.30),
  ('practice',    'gemini', 'gemini-2.0-flash', 2048,  0.70),
  ('email',       'gemini', 'gemini-2.5-pro',   4096,  0.50),
  ('analyzer',    'gemini', 'gemini-2.5-pro',   4096,  0.30),
  ('strategies',  'gemini', 'gemini-2.5-pro',   2048,  0.50)
ON CONFLICT (feature) DO NOTHING;
