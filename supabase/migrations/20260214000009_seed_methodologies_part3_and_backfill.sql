-- ============================================================================
-- Migration: 20260214000009_seed_methodologies_part3_and_backfill
-- Purpose: Seed final 4 methodologies (sort_order 10-13) and backfill
--          existing Paul Cherry strategies with their methodology_id.
--
-- Methodologies added:
--   10. The Challenger Sale (Dixon & Adamson)
--   11. BANT (IBM)
--   12. MEDDIC/MEDDPICC (Jack Napoli)
--   13. Conceptual Selling (Miller & Heiman)
--
-- Uses INSERT ... ON CONFLICT (slug) DO NOTHING for idempotent re-runs.
-- ============================================================================

-- 10. The Challenger Sale
INSERT INTO methodologies (
  name, slug, author, tagline, description, how_it_works, best_for,
  videos, books, icon, category, relevance_rating, complexity_level, tags,
  system_prompt_template, feature_prompt_overrides,
  scoring_rubric, stages, question_types, vocabulary,
  anti_patterns, success_signals, learning_objectives, concept_chunks,
  access_tier, trademark_attribution, known_as, sort_order, is_active
) VALUES (
  'The Challenger Sale',
  'the-challenger-sale',
  'Matthew Dixon & Brent Adamson',
  'Teach, tailor, and take control of the sales conversation.',
  'The Challenger Sale argues that the most successful sales reps don''t just build relationships -- they challenge customers'' thinking. By teaching prospects something new about their business, tailoring the message to their specific context, and taking control of the conversation, reps create differentiated value that competitors cannot match.',
  'Challengers lead with insights, not product features. They reframe how the prospect thinks about their problem, connect that reframe to the rep''s unique strengths, and guide the conversation toward a decision with constructive tension.',
  'Reps selling to sophisticated buyers who already have opinions. Ideal when the prospect does not yet realize the full scope of the problem or when competitors offer similar solutions.',
  '[]'::jsonb,
  '[{"title":"The Challenger Sale","author":"Matthew Dixon & Brent Adamson","year":2011}]'::jsonb,
  'swords',
  'framework',
  3,
  'advanced',
  ARRAY['challenger','teaching','tailoring','b2b','enterprise','differentiation'],
  'You are a Challenger Sale coach for volume photography B2B sales reps. Guide the rep to teach prospects something they did not know about their photography needs, tailor the insight to the prospect''s specific situation (dance studio, school, daycare, sports org), and take control by confidently steering toward next steps. Emphasize commercial teaching -- reframing how the prospect views their current picture-day process.',
  '{}'::jsonb,
  '[{"criterion":"commercial_teaching","weight":0.30,"description":"Rep teaches the prospect a new insight about their business"},{"criterion":"tailoring","weight":0.25,"description":"Message is customized to the prospect''s specific context"},{"criterion":"constructive_tension","weight":0.25,"description":"Rep creates productive discomfort with the status quo"},{"criterion":"control","weight":0.20,"description":"Rep confidently steers the conversation toward commitment"}]'::jsonb,
  '[{"key":"teach","label":"Teach","description":"Lead with a provocative insight that reframes the prospect''s thinking"},{"key":"tailor","label":"Tailor","description":"Customize the message to the prospect''s specific world"},{"key":"take-control","label":"Take Control","description":"Guide the conversation toward a decision with confidence"}]'::jsonb,
  '[]'::jsonb,
  '{"reframe":"A new way of looking at the prospect''s current process","commercial_insight":"A teaching pitch that leads back to your unique strengths","constructive_tension":"Productive discomfort that motivates change"}'::jsonb,
  '["Falling back to relationship-building without teaching","Sharing insights that do not connect to your unique value","Avoiding tension and letting the prospect stay comfortable"]'::jsonb,
  '["Prospect says ''I never thought of it that way''","Prospect asks how you specifically solve the problem","Prospect agrees the status quo has hidden costs"]'::jsonb,
  '["Craft a commercial teaching pitch for volume photography","Tailor insights to different prospect verticals","Use constructive tension without damaging rapport"]'::jsonb,
  '[]'::jsonb,
  'pro',
  'The Challenger Sale is a methodology by Matthew Dixon and Brent Adamson of CEB/Gartner. Used for educational reference.',
  'Challenger Selling',
  10,
  true
) ON CONFLICT (slug) DO NOTHING;

-- 11. BANT
INSERT INTO methodologies (
  name, slug, author, tagline, description, how_it_works, best_for,
  videos, books, icon, category, relevance_rating, complexity_level, tags,
  system_prompt_template, feature_prompt_overrides,
  scoring_rubric, stages, question_types, vocabulary,
  anti_patterns, success_signals, learning_objectives, concept_chunks,
  access_tier, trademark_attribution, known_as, sort_order, is_active
) VALUES (
  'BANT',
  'bant',
  'IBM',
  'Qualify prospects quickly using Budget, Authority, Need, and Timeline.',
  'BANT is one of the oldest and simplest qualification frameworks in B2B sales. Developed at IBM, it helps reps quickly determine whether a prospect is worth pursuing by checking four criteria: does the prospect have Budget, is the contact the decision-making Authority, is there a genuine Need, and what is their Timeline for a decision?',
  'Ask targeted questions to uncover each of the four BANT criteria. If a prospect fails on multiple criteria, deprioritize and move on. BANT works as a quick filter before investing deeper discovery time.',
  'High-volume prospecting where reps need a fast yes/no filter. Best for straightforward sales with short cycles and clear decision makers -- such as selling picture-day packages to individual studio owners.',
  '[]'::jsonb,
  '[]'::jsonb,
  'clipboard-check',
  'framework',
  2,
  'beginner',
  ARRAY['bant','qualification','budget','authority','need','timeline','ibm'],
  'You are a BANT qualification coach for volume photography B2B sales reps. Help the rep efficiently qualify prospects (dance studios, schools, daycares, sports orgs) by uncovering Budget availability, decision-making Authority, genuine Need for professional photography, and Timeline for their next event. Keep qualification conversational -- avoid sounding like an interrogation.',
  '{}'::jsonb,
  '[{"criterion":"budget_qualification","weight":0.25,"description":"Rep uncovers whether the prospect has budget for photography services"},{"criterion":"authority_identification","weight":0.25,"description":"Rep identifies who makes or influences the purchasing decision"},{"criterion":"need_assessment","weight":0.25,"description":"Rep confirms a genuine need for volume photography"},{"criterion":"timeline_clarity","weight":0.25,"description":"Rep establishes when the prospect needs photography services"}]'::jsonb,
  '[{"key":"budget","label":"Budget","description":"Determine if the prospect has allocated funds for photography"},{"key":"authority","label":"Authority","description":"Identify the decision maker and buying process"},{"key":"need","label":"Need","description":"Confirm genuine need for professional photography services"},{"key":"timeline","label":"Timeline","description":"Establish when the prospect needs to make a decision"}]'::jsonb,
  '[]'::jsonb,
  '{"qualified":"Prospect meets 3+ BANT criteria","disqualified":"Prospect fails on 2+ criteria","champion":"Internal advocate who can influence the decision maker"}'::jsonb,
  '["Interrogating the prospect with rapid-fire qualification questions","Asking about budget too early before establishing value","Accepting vague answers without probing deeper"]'::jsonb,
  '["Prospect shares specific budget range","Prospect confirms they are the decision maker","Prospect names a specific event date or deadline"]'::jsonb,
  '["Qualify photography prospects without sounding like an interrogation","Uncover budget constraints naturally in conversation","Identify the real decision maker in schools and studios"]'::jsonb,
  '[]'::jsonb,
  'pro',
  'BANT is a qualification framework originally developed at IBM. Used for educational reference.',
  'BANT Qualification',
  11,
  true
) ON CONFLICT (slug) DO NOTHING;

-- 12. MEDDIC/MEDDPICC
INSERT INTO methodologies (
  name, slug, author, tagline, description, how_it_works, best_for,
  videos, books, icon, category, relevance_rating, complexity_level, tags,
  system_prompt_template, feature_prompt_overrides,
  scoring_rubric, stages, question_types, vocabulary,
  anti_patterns, success_signals, learning_objectives, concept_chunks,
  access_tier, trademark_attribution, known_as, sort_order, is_active
) VALUES (
  'MEDDIC/MEDDPICC',
  'meddic-meddpicc',
  'Jack Napoli',
  'Rigorously qualify complex deals with Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, and Champion.',
  'MEDDIC is an enterprise qualification methodology that goes deeper than BANT. Each letter represents a critical element that must be validated before committing resources to a deal. MEDDPICC extends it with Paper Process, Implicate the Pain, and Competition. It forces reps to truly understand how decisions get made inside the prospect''s organization.',
  'Work through each element systematically: quantify the Metrics the prospect cares about, gain access to the Economic Buyer, map the Decision Criteria and Decision Process, Identify Pain at a deep level, and develop an internal Champion who sells on your behalf when you are not in the room.',
  'Complex, multi-stakeholder deals with long sales cycles. When selling photography services to large school districts, multi-location daycare chains, or organizations with formal procurement processes.',
  '[]'::jsonb,
  '[]'::jsonb,
  'list-ordered',
  'framework',
  2,
  'advanced',
  ARRAY['meddic','meddpicc','enterprise','qualification','complex-sales','champion'],
  'You are a MEDDIC/MEDDPICC coach for volume photography B2B sales reps. Help the rep rigorously qualify complex deals by mapping Metrics the prospect values, accessing the Economic Buyer, understanding Decision Criteria and Decision Process, identifying deep Pain around their current photography solution, and developing an internal Champion. Apply this to volume photography contexts like school districts, daycare chains, and large sports organizations.',
  '{}'::jsonb,
  '[{"criterion":"metrics_clarity","weight":0.20,"description":"Rep quantifies the business impact the prospect cares about"},{"criterion":"economic_buyer_access","weight":0.20,"description":"Rep identifies and gains access to the economic buyer"},{"criterion":"decision_mapping","weight":0.20,"description":"Rep maps both decision criteria and decision process"},{"criterion":"pain_identification","weight":0.20,"description":"Rep uncovers deep organizational pain beyond surface complaints"},{"criterion":"champion_development","weight":0.20,"description":"Rep develops an internal champion who advocates on their behalf"}]'::jsonb,
  '[{"key":"metrics","label":"Metrics","description":"Quantify the business outcomes the prospect needs"},{"key":"economic-buyer","label":"Economic Buyer","description":"Identify and access the person with budget authority"},{"key":"decision-criteria","label":"Decision Criteria","description":"Understand what criteria will drive the decision"},{"key":"decision-process","label":"Decision Process","description":"Map the steps and stakeholders in the buying process"},{"key":"identify-pain","label":"Identify Pain","description":"Uncover deep organizational pain and its business impact"},{"key":"champion","label":"Champion","description":"Develop an internal advocate who sells when you are not there"}]'::jsonb,
  '[]'::jsonb,
  '{"economic_buyer":"The person who can say yes when everyone else says no","champion":"An internal advocate with influence and a personal reason to support you","paper_process":"The procurement and legal steps required to close the deal"}'::jsonb,
  '["Skipping the economic buyer and selling only to a coach","Accepting surface-level pain without quantifying business impact","Assuming a friendly contact is a champion without testing their influence"]'::jsonb,
  '["Prospect shares quantified metrics they need to achieve","Economic buyer agrees to a meeting","Internal champion proactively shares competitive intelligence"]'::jsonb,
  '["Map decision processes in school districts and organizations","Quantify photography ROI in terms the economic buyer values","Develop and test internal champions in prospect organizations"]'::jsonb,
  '[]'::jsonb,
  'pro',
  'MEDDIC is a methodology developed by Jack Napoli and Dick Dunkel at PTC. Used for educational reference.',
  'MEDDIC',
  12,
  true
) ON CONFLICT (slug) DO NOTHING;

-- 13. Conceptual Selling
INSERT INTO methodologies (
  name, slug, author, tagline, description, how_it_works, best_for,
  videos, books, icon, category, relevance_rating, complexity_level, tags,
  system_prompt_template, feature_prompt_overrides,
  scoring_rubric, stages, question_types, vocabulary,
  anti_patterns, success_signals, learning_objectives, concept_chunks,
  access_tier, trademark_attribution, known_as, sort_order, is_active
) VALUES (
  'Conceptual Selling',
  'conceptual-selling',
  'Robert Miller & Stephen Heiman',
  'Understand the customer''s concept of what they want before proposing your solution.',
  'Conceptual Selling focuses on understanding the prospect''s mental concept of what they want to achieve -- not your product. Before presenting any solution, reps must first deeply understand how the prospect thinks about their situation, what results they envision, and what concerns they have. Only then should the rep align their offering to that concept.',
  'Use three phases: Getting Information (understand the prospect''s concept through five question types), Giving Information (present your solution aligned to their concept), and Getting Commitment (confirm mutual next steps). The key insight is that customers buy based on their concept, not your product.',
  'Consultative sales where the prospect''s perception of the problem matters more than features. Ideal for selling photography services where studio owners have a specific vision for their events and need to feel understood before committing.',
  '[]'::jsonb,
  '[{"title":"The New Conceptual Selling","author":"Robert Miller & Stephen Heiman","year":2005}]'::jsonb,
  'brain',
  'process',
  2,
  'advanced',
  ARRAY['conceptual-selling','miller-heiman','consultative','customer-concept','korn-ferry'],
  'You are a Conceptual Selling coach for volume photography B2B sales reps. Help the rep uncover each prospect''s unique concept of what they want from their picture-day experience before proposing solutions. Guide the rep through Getting Information (understanding the studio owner''s or school''s vision), Giving Information (aligning photography services to that vision), and Getting Commitment (securing clear next steps). Emphasize that the prospect buys their concept, not your product.',
  '{}'::jsonb,
  '[{"criterion":"concept_understanding","weight":0.30,"description":"Rep uncovers the prospect''s personal concept of what they want"},{"criterion":"information_gathering","weight":0.25,"description":"Rep uses effective questions to understand the full picture"},{"criterion":"joint_planning","weight":0.25,"description":"Rep aligns their solution to the prospect''s concept collaboratively"},{"criterion":"commitment_gaining","weight":0.20,"description":"Rep secures clear, mutual commitment for next steps"}]'::jsonb,
  '[{"key":"getting-information","label":"Getting Information","description":"Understand the prospect''s concept through targeted questions"},{"key":"giving-information","label":"Giving Information","description":"Present your solution aligned to the prospect''s concept"},{"key":"getting-commitment","label":"Getting Commitment","description":"Secure mutual commitment for clear next steps"}]'::jsonb,
  '[]'::jsonb,
  '{"concept":"The prospect''s mental picture of what they want to achieve","win_result":"A positive personal outcome for the decision maker","single_sales_objective":"The specific commitment you want from this interaction"}'::jsonb,
  '["Presenting product features before understanding the prospect''s concept","Assuming your concept of the problem matches the prospect''s","Pushing for commitment before the prospect feels fully understood"]'::jsonb,
  '["Prospect describes their ideal picture-day experience in detail","Prospect confirms your summary matches their vision","Prospect suggests specific next steps without being pushed"]'::jsonb,
  '["Uncover prospect concepts for different photography verticals","Align photography service presentations to prospect concepts","Secure commitment through joint planning rather than pressure"]'::jsonb,
  '[]'::jsonb,
  'pro',
  'Conceptual Selling is a methodology by Robert Miller and Stephen Heiman, now part of Korn Ferry. Used for educational reference.',
  'Miller Heiman Conceptual Selling',
  13,
  true
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Backfill: Link existing Paul Cherry strategies to their methodology
-- ============================================================================
-- Any strategies with category='questioning' that are not yet linked to a
-- methodology are assumed to be Paul Cherry "Questions That Sell" content.
-- This UPDATE is safe: if the methodology row doesn't exist yet, the
-- subquery returns NULL and the WHERE clause filters those rows out.
-- ============================================================================
UPDATE strategies
SET methodology_id = (SELECT id FROM methodologies WHERE slug = 'questions-that-sell')
WHERE methodology_id IS NULL
  AND category = 'questioning'
  AND (SELECT id FROM methodologies WHERE slug = 'questions-that-sell') IS NOT NULL;
