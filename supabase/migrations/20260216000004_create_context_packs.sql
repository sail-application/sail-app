-- ============================================================================
-- Migration: 20260216000004_create_context_packs
-- Purpose: Context Packs (Industry Modes) — modular industry overlays that
--          inject domain-specific context into the AI without replacing
--          the active methodology.
--
-- A context pack enriches the coaching experience for a specific industry
-- or use case. It adds:
--   - identity_overlay: appended to Layer 1 (base identity) in the system prompt
--   - vocabulary_overlay: industry-specific terms merged with methodology vocab
--   - persona_templates: pre-built practice scenarios for this context
--   - suggested_methodology_ids: which methodologies work best for this context
--
-- Initial packs (5):
--   1. B2B SaaS Sales
--   2. Home Services
--   3. Volume Photography  ← keeps SA Picture Day's original context
--   4. Parenting & Family
--   5. Negotiation
-- ============================================================================

CREATE TABLE IF NOT EXISTS context_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable name shown in the UI
  name TEXT NOT NULL,

  -- URL-safe identifier (e.g., "b2b-saas-sales")
  slug TEXT NOT NULL UNIQUE,

  -- Short description shown in the selector
  description TEXT,

  -- Injected after BASE_IDENTITY in Layer 1 of the system prompt
  -- E.g., "You are coaching a B2B SaaS sales representative selling to enterprise IT buyers."
  identity_overlay TEXT,

  -- Pre-built practice scenarios for this industry context
  -- Array of: { "title": "...", "description": "...", "persona": "...", "difficulty": "..." }
  persona_templates JSONB DEFAULT '[]',

  -- Industry-specific vocabulary merged with methodology vocabulary in Layer 2
  -- Key-value: { "ARR": "Annual Recurring Revenue", "champion": "..." }
  vocabulary_overlay JSONB DEFAULT '{}',

  -- Methodology IDs that work well with this context (for the UI to suggest)
  suggested_methodology_ids UUID[] DEFAULT '{}',

  -- Emoji or icon string shown next to the pack name in the UI
  icon TEXT,

  -- Whether this pack is available to users
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE context_packs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active context packs
CREATE POLICY "Authenticated users can read active context packs"
  ON context_packs FOR SELECT TO authenticated
  USING (is_active = true);

-- Only admins can create/update/delete context packs
CREATE POLICY "Admins can manage context packs"
  ON context_packs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Index for fast slug lookup
CREATE INDEX IF NOT EXISTS idx_context_packs_slug ON context_packs (slug);
CREATE INDEX IF NOT EXISTS idx_context_packs_active ON context_packs (is_active);

-- ── Add FK from session_configurations to context_packs ────────────────────
-- (The FK was deferred until this table exists)

ALTER TABLE session_configurations
  ADD CONSTRAINT fk_session_configurations_context_pack
  FOREIGN KEY (context_pack_id) REFERENCES context_packs(id) ON DELETE SET NULL;

COMMENT ON TABLE context_packs IS 'Industry/domain context packs — modular overlays that inject industry-specific AI coaching context';

-- ── Seed Initial Context Packs ───────────────────────────────────────────────

INSERT INTO context_packs (name, slug, description, identity_overlay, vocabulary_overlay, icon, persona_templates)
VALUES

-- 1. B2B SaaS Sales
(
  'B2B SaaS Sales',
  'b2b-saas-sales',
  'Enterprise and mid-market software selling. Navigate multi-stakeholder deals, champion building, and technical evaluations.',
  'You are coaching a B2B SaaS sales representative. Their prospects are typically IT directors, VP of Engineering, or C-suite executives at companies with 50-5000 employees. Deals range from $10k-$500k ARR with 1-9 month sales cycles. Key challenges: multi-threading accounts, navigating procurement, and proving ROI.',
  '{"ARR": "Annual Recurring Revenue — the yearly subscription value", "champion": "An internal advocate inside the prospect company who wants you to win", "economic buyer": "The person who controls the budget and signs the contract", "multi-threading": "Building relationships with multiple stakeholders at once", "proof of concept": "A trial or pilot to demonstrate value before full purchase", "implementation partner": "A third-party that helps deploy the software"}',
  '💻',
  '[{"title": "Cold Call to IT Director", "description": "You are cold calling a VP of IT at a 200-person manufacturing company. Introduce SAIL and qualify interest.", "persona": "Skeptical VP of IT who gets 20 cold calls per day", "difficulty": "medium"}, {"title": "Discovery Call with Champion", "description": "You have an intro call with a Sales Ops manager who found you online and is interested. Your goal: uncover pain and get exec access.", "persona": "Enthusiastic Sales Ops manager who loves tools but needs budget approval", "difficulty": "easy"}]'
),

-- 2. Home Services
(
  'Home Services',
  'home-services',
  'In-home selling for service businesses: HVAC, garage doors, plumbing, roofing, pest control. Appointment-based with immediate close pressure.',
  'You are coaching an in-home sales representative for a home services company. They meet with homeowners in their homes and typically need to close on the same visit. Common industries: HVAC, garage doors, gutters, pest control, plumbing. Prospects have an immediate problem and you must establish trust quickly and overcome price objections.',
  '{"one-legger": "A home visit where only one decision-maker is present (the other is missing)", "same-day close": "Getting a signed agreement during the first and only in-home visit", "lowball competitors": "Competitors who quote low and add fees later", "financing": "Monthly payment options to reduce sticker shock"}',
  '🏠',
  '[{"title": "Garage Door Replacement Quote", "description": "A homeowner called because their garage door spring broke. You are there to quote a replacement.", "persona": "Price-conscious homeowner who already got one quote from a competitor", "difficulty": "medium"}, {"title": "HVAC System Replacement", "description": "A homeowner''s AC stopped working. You need to recommend a full system replacement at $8,000.", "persona": "Retired couple on fixed income, skeptical of large purchases", "difficulty": "hard"}]'
),

-- 3. Volume Photography (original SAIL use case — kept for backwards compatibility)
(
  'Volume Photography',
  'volume-photography',
  'B2B sales for school and event photography businesses. Target organizations that have recurring picture days: schools, dance studios, sports leagues, daycares.',
  'You are coaching a volume photography sales representative. Their business photographs large groups for schools, dance studios, sports organizations, and daycare centers. Prospects are administrators, directors, or coordinators who book picture days annually. Key selling points: reliability, quick turnaround, online ordering, competitive pricing. Typical deal: $500-$5,000 in revenue per picture day event.',
  '{"picture day": "An event where the photographer photographs every student or participant in an organization", "volume": "High quantity of subjects photographed in a single session", "online ordering": "The digital platform where parents purchase photos", "proofs": "Sample photos sent to parents before they order", "package": "A bundled set of photo prints at a set price point"}',
  '📸',
  '[{"title": "Dance Studio Cold Call", "description": "You are calling a dance studio owner to pitch your picture day service for their upcoming recital season.", "persona": "Busy dance studio owner who already has a photography vendor but is open to alternatives", "difficulty": "medium"}, {"title": "School District Presentation", "description": "You have a 10-minute slot to pitch your service to a school district coordinator who manages 8 elementary schools.", "persona": "School district coordinator who values reliability and parent satisfaction above price", "difficulty": "hard"}]'
),

-- 4. Parenting & Family
(
  'Parenting & Family',
  'parenting-family',
  'Communication skills for parenting, co-parenting, and family conversations. Age-appropriate approaches, setting boundaries with empathy.',
  'You are coaching someone on effective family communication. This includes talking with children of various ages, co-parenting conversations, and navigating difficult family dynamics. Focus on empathy-first communication, active listening, setting clear expectations, and de-escalating conflict. Avoid judgment — every family dynamic is unique.',
  '{"active listening": "Fully focusing on what the other person says before responding", "I-statement": "Expressing your feelings without blaming (''I feel frustrated when...'')", "natural consequence": "Allowing the child to experience the result of their own choices", "co-regulation": "Helping a child calm down by modeling calm behavior yourself", "positive reinforcement": "Rewarding good behavior to encourage it"}',
  '👨‍👩‍👧',
  '[{"title": "Screen Time Negotiation", "description": "You need to set a new screen time rule with your 13-year-old who pushes back on every limit.", "persona": "A teenager who argues that all their friends have unlimited screen time", "difficulty": "medium"}, {"title": "Co-parenting Logistics", "description": "You need to discuss a schedule change with your co-parent who often gets defensive during these conversations.", "persona": "A co-parent who feels their time is being reduced and becomes emotional", "difficulty": "hard"}]'
),

-- 5. Negotiation
(
  'Negotiation',
  'negotiation',
  'Principled negotiation for salary, lease, vendor contracts, and everyday agreements. Interest-based approaches that preserve relationships.',
  'You are coaching someone through a negotiation. This could be a salary negotiation, lease negotiation, vendor contract discussion, or any situation where two parties need to reach an agreement. Coach them to separate people from the problem, focus on interests not positions, generate options for mutual gain, and insist on objective criteria.',
  '{"BATNA": "Best Alternative to a Negotiated Agreement — your fallback if talks fail", "ZOPA": "Zone of Possible Agreement — the range where both parties can say yes", "anchor": "The first number put on the table, which sets the psychological reference point", "reservation price": "The worst acceptable deal — walk away point", "interest": "The underlying need or concern behind a stated position", "position": "What someone says they want (often different from their true interest)"}',
  '🤝',
  '[{"title": "Salary Negotiation", "description": "You received a job offer at $85k but the market rate is $95-105k. Negotiate for a better package.", "persona": "HR recruiter who says the budget is ''firm'' at $85k", "difficulty": "medium"}, {"title": "Vendor Contract Renewal", "description": "Your SaaS vendor wants a 30% price increase at renewal. You need to negotiate a better deal or switch.", "persona": "Account manager who insists the price increase is non-negotiable", "difficulty": "hard"}]'
)

ON CONFLICT (slug) DO NOTHING;
