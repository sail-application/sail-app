-- ============================================================================
-- Migration: 20260214000008_seed_methodologies_part2
-- Purpose: Seed methodologies 5-9 (Value Selling, Solution Selling, NEAT,
--          Sandler, Inbound Selling). ON CONFLICT (slug) DO NOTHING.
-- ============================================================================

-- 5. Value Selling Framework
INSERT INTO methodologies (
  name, slug, author, tagline, description, how_it_works, best_for,
  videos, books, icon, category, relevance_rating, complexity_level, tags,
  system_prompt_template, feature_prompt_overrides, scoring_rubric, stages,
  question_types, vocabulary, anti_patterns, success_signals,
  learning_objectives, concept_chunks,
  access_tier, trademark_attribution, known_as, sort_order, is_active
) VALUES (
  'Value Selling Framework', 'value-selling-framework', 'ValueSelling Associates',
  'Align your solution to the buyer''s business issues with a structured value conversation.',
  'The Value Selling Framework helps reps connect their solution directly to the buyer''s measurable business issues. Instead of leading with features, reps learn to uncover what matters financially and operationally, then position their offering as the resolution.',
  'Reps use a structured conversation to (1) identify a business issue the prospect cares about, (2) explore the root problem behind it, (3) quantify the impact, and (4) present a differentiated solution tied to that impact. A "Qualified Prospect Formula" ensures only real opportunities move forward.',
  'B2B sales where the buyer needs to justify ROI internally. Ideal for volume photography reps selling to studio owners and school administrators who must see clear business value before switching providers.',
  '[]'::jsonb,
  '[{"title":"Value Selling","author":"Julie Thomas","year":2022}]'::jsonb,
  'diamond', 'framework', 4, 'intermediate',
  ARRAY['value','ROI','business-issues','qualification','differentiation'],
  'You are a Value Selling Framework coach for volume photography B2B sales. Guide the rep to uncover the prospect''s core business issue (e.g., parent satisfaction, revenue per session, rebooking rates), quantify the financial impact of solving it, and position our photography services as a differentiated solution. Always tie recommendations to measurable outcomes. Discourage feature-dumping; insist on business-issue-first conversations.',
  '{}'::jsonb,
  '[{"criterion":"value_alignment","weight":0.30,"description":"Solution is tied to a specific, quantified business issue"},{"criterion":"business_issue_focus","weight":0.25,"description":"Conversation centers on prospect pain, not product features"},{"criterion":"differentiation","weight":0.25,"description":"Rep clearly articulates why this solution is different from alternatives"},{"criterion":"qualification_rigor","weight":0.20,"description":"Rep validates budget, authority, need, and timeline before advancing"}]'::jsonb,
  '[{"key":"qualify","label":"Qualify","description":"Identify a real business issue and confirm authority and budget"},{"key":"differentiate","label":"Differentiate","description":"Show how your solution uniquely addresses the business issue"},{"key":"justify","label":"Justify","description":"Quantify ROI and build the business case"},{"key":"close","label":"Close","description":"Gain commitment with a clear next step"}]'::jsonb,
  '[{"type":"business_issue","example":"What is the biggest challenge you face with your current photography provider?"},{"type":"impact","example":"How does that affect your revenue from picture day events?"},{"type":"differentiation","example":"What would it mean for your studio if rebooking rates went up 20%?"}]'::jsonb,
  '{"key_terms":["business issue","value driver","qualified prospect formula","differentiated solution","ROI justification"],"avoid":["let me tell you about our features","we are the best"]}'::jsonb,
  '[{"pattern":"Leading with a feature list instead of asking about business issues"},{"pattern":"Skipping qualification and pitching to unqualified prospects"},{"pattern":"Failing to quantify the financial impact of the problem"}]'::jsonb,
  '[{"signal":"Prospect describes their business issue in their own words"},{"signal":"Prospect asks about pricing after understanding the value"},{"signal":"Prospect shares internal budget or approval process details"}]'::jsonb,
  '[{"objective":"Open conversations by exploring business issues, not product features"},{"objective":"Quantify the financial impact of a prospect''s problem"},{"objective":"Build differentiation statements specific to volume photography"}]'::jsonb,
  '[{"chunk":"Qualified Prospect Formula","summary":"Checklist ensuring every opportunity has a confirmed business issue, access to authority, budget, and a compelling event."},{"chunk":"VisionMatch","summary":"Technique for aligning your solution vision with the buyer''s desired future state."}]'::jsonb,
  'pro', 'Value Selling Framework is a registered trademark of ValueSelling Associates. Used for educational reference.',
  'Value Selling, VSF', 5, true
) ON CONFLICT (slug) DO NOTHING;

-- 6. Solution Selling
INSERT INTO methodologies (
  name, slug, author, tagline, description, how_it_works, best_for,
  videos, books, icon, category, relevance_rating, complexity_level, tags,
  system_prompt_template, feature_prompt_overrides, scoring_rubric, stages,
  question_types, vocabulary, anti_patterns, success_signals,
  learning_objectives, concept_chunks,
  access_tier, trademark_attribution, known_as, sort_order, is_active
) VALUES (
  'Solution Selling', 'solution-selling', 'Mike Bosworth',
  'Lead with the buyer''s pain, not your product''s features.',
  'Solution Selling reframes the sales conversation around the buyer''s pain points. Reps diagnose problems first, help the buyer envision a solution, then position their offering as the path from pain to resolution. Buyers buy because of pain, not features.',
  'Reps follow a structured flow: (1) Diagnose the buyer''s latent or active pain, (2) Help the buyer envision life after the pain is resolved, (3) Qualify by confirming authority, budget, and timeline, (4) Close by aligning the solution to the envisioned future state.',
  'Reps who lead with product demos or feature lists. Effective for volume photography sales where studio owners may not realize their current provider is causing pain until the right diagnostic questions are asked.',
  '[]'::jsonb,
  '[{"title":"Solution Selling","author":"Michael Bosworth","year":1994}]'::jsonb,
  'puzzle', 'process', 4, 'beginner',
  ARRAY['pain','diagnosis','vision','buyer-centric','solution'],
  'You are a Solution Selling coach for volume photography B2B sales. Help the rep uncover latent pain the prospect may not have articulated — poor photo quality, slow turnaround, low parent purchase rates, or clunky ordering systems. Guide the rep to create a vision of what picture day could look like with a better provider. Never let the rep pitch features before diagnosing pain.',
  '{}'::jsonb,
  '[{"criterion":"pain_discovery","weight":0.30,"description":"Rep uncovers specific, acknowledged pain the prospect is experiencing"},{"criterion":"vision_creation","weight":0.25,"description":"Rep helps the prospect envision a better future state"},{"criterion":"qualification","weight":0.25,"description":"Rep confirms decision authority, budget, and urgency"},{"criterion":"value_proposition","weight":0.20,"description":"Solution is positioned as the bridge from pain to vision"}]'::jsonb,
  '[{"key":"diagnose","label":"Diagnose","description":"Uncover latent or active pain through open-ended questions"},{"key":"envision","label":"Envision","description":"Help the buyer picture life after the problem is solved"},{"key":"qualify","label":"Qualify","description":"Confirm authority, budget, and timeline"},{"key":"close","label":"Close","description":"Position your solution as the path from pain to the envisioned future"}]'::jsonb,
  '[{"type":"pain_diagnostic","example":"What happens when parents complain about photo quality from your current provider?"},{"type":"vision","example":"Imagine if every parent received photos within 48 hours — how would that change rebooking conversations?"},{"type":"latent_pain","example":"How much time does your staff spend handling photo-day logistics each season?"}]'::jsonb,
  '{"key_terms":["latent pain","active pain","vision creation","pain chain","solution alignment"],"avoid":["here is what we offer","our product does"]}'::jsonb,
  '[{"pattern":"Pitching features before the buyer has acknowledged any pain"},{"pattern":"Accepting surface-level answers without probing for deeper pain"},{"pattern":"Skipping the vision step and jumping straight to the proposal"}]'::jsonb,
  '[{"signal":"Prospect openly describes frustrations with their current provider"},{"signal":"Prospect uses future-tense language about working with you"},{"signal":"Prospect voluntarily shares decision-making details"}]'::jsonb,
  '[{"objective":"Diagnose latent pain that prospects have not yet articulated"},{"objective":"Create vivid future-state visions tied to photography outcomes"},{"objective":"Develop the discipline to qualify before proposing"}]'::jsonb,
  '[{"chunk":"Pain Chain","summary":"Cause-and-effect sequence tracing a surface problem to business impact — slow delivery to low parent satisfaction to lost rebookings."},{"chunk":"9-Block Vision Processing","summary":"Structured matrix for creating buying vision across pain, reasons, and capabilities at three organizational levels."}]'::jsonb,
  'pro', 'Solution Selling is a methodology originally developed by Mike Bosworth. Used for educational reference.',
  'Solution Selling', 6, true
) ON CONFLICT (slug) DO NOTHING;

-- 7. NEAT Selling
INSERT INTO methodologies (
  name, slug, author, tagline, description, how_it_works, best_for,
  videos, books, icon, category, relevance_rating, complexity_level, tags,
  system_prompt_template, feature_prompt_overrides, scoring_rubric, stages,
  question_types, vocabulary, anti_patterns, success_signals,
  learning_objectives, concept_chunks,
  access_tier, trademark_attribution, known_as, sort_order, is_active
) VALUES (
  'NEAT Selling', 'neat-selling', 'Richard Harris',
  'Qualify prospects faster with Need, Economic Impact, Access to Authority, and Timeline.',
  'NEAT Selling is a modern qualification framework that replaces outdated BANT. Instead of leading with budget, reps lead with Need and Economic Impact — helping prospects understand the true cost of inaction before discussing price. Access to Authority ensures you talk to the right person, and Timeline creates urgency.',
  'Reps work through four dimensions: (1) Need — what core need does the prospect have? (2) Economic Impact — what is the financial cost of not solving it? (3) Access to Authority — is the rep talking to someone who can say yes? (4) Timeline — what event or deadline creates urgency?',
  'Reps who struggle with qualification or waste time on unqualified prospects. Great for volume photography where studio owners often have need but lack urgency — NEAT helps create urgency through economic impact.',
  '[]'::jsonb, '[]'::jsonb,
  'list-checks', 'framework', 4, 'beginner',
  ARRAY['qualification','NEAT','need','economic-impact','authority','timeline'],
  'You are a NEAT Selling coach for volume photography B2B sales. Help the rep qualify efficiently by uncovering genuine Need (better photo quality, higher parent purchase rates), quantifying Economic Impact (revenue lost per event with current provider), verifying Access to Authority (studio owner or decision-maker, not a coordinator), and establishing Timeline (upcoming recital season, contract renewal). Push the rep to always quantify economic impact in dollars.',
  '{}'::jsonb,
  '[{"criterion":"need_identification","weight":0.30,"description":"Rep identifies a core, specific need the prospect acknowledges"},{"criterion":"economic_impact","weight":0.25,"description":"Rep quantifies the financial cost of inaction or current pain"},{"criterion":"authority_mapping","weight":0.25,"description":"Rep confirms they are speaking with or have access to the decision-maker"},{"criterion":"timeline_urgency","weight":0.20,"description":"Rep identifies a specific event or deadline driving the purchase decision"}]'::jsonb,
  '[{"key":"need","label":"Need","description":"Uncover the core need driving the prospect to consider a change"},{"key":"economic-impact","label":"Economic Impact","description":"Quantify the financial cost of the current problem or inaction"},{"key":"access","label":"Access to Authority","description":"Confirm the decision-maker and path to approval"},{"key":"timeline","label":"Timeline","description":"Identify the event or deadline that creates purchase urgency"}]'::jsonb,
  '[{"type":"need","example":"What is driving you to look at new photography providers right now?"},{"type":"economic_impact","example":"Roughly how much revenue per event are you leaving on the table with your current setup?"},{"type":"authority","example":"Who else would need to sign off on a provider change?"},{"type":"timeline","example":"When is your next recital or picture day season?"}]'::jsonb,
  '{"key_terms":["need","economic impact","access to authority","timeline","cost of inaction","qualification"],"avoid":["what is your budget","are you the decision-maker"]}'::jsonb,
  '[{"pattern":"Asking about budget before establishing economic impact"},{"pattern":"Accepting vague needs without drilling into specifics"},{"pattern":"Ignoring timeline and letting the deal stall without urgency"}]'::jsonb,
  '[{"signal":"Prospect quantifies the cost of their current problem"},{"signal":"Prospect introduces you to the decision-maker"},{"signal":"Prospect names a specific date or event driving their timeline"}]'::jsonb,
  '[{"objective":"Replace BANT-style questions with need-first qualification"},{"objective":"Quantify economic impact in photography sales scenarios"},{"objective":"Identify and leverage timeline urgency in seasonal businesses"}]'::jsonb,
  '[{"chunk":"Economic Impact Framing","summary":"Technique for helping prospects calculate the true cost of inaction — revenue per unsold photo package multiplied by events per year."},{"chunk":"Authority Mapping","summary":"Process for identifying all stakeholders in the buying decision and understanding their individual motivations."}]'::jsonb,
  'pro', 'NEAT Selling is a framework developed by Richard Harris of The Harris Consulting Group. Used for educational reference.',
  'NEAT Selling, NEAT Framework', 7, true
) ON CONFLICT (slug) DO NOTHING;

-- 8. Sandler Selling System
INSERT INTO methodologies (
  name, slug, author, tagline, description, how_it_works, best_for,
  videos, books, icon, category, relevance_rating, complexity_level, tags,
  system_prompt_template, feature_prompt_overrides, scoring_rubric, stages,
  question_types, vocabulary, anti_patterns, success_signals,
  learning_objectives, concept_chunks,
  access_tier, trademark_attribution, known_as, sort_order, is_active
) VALUES (
  'Sandler Selling System', 'sandler-selling-system', 'David Sandler',
  'Use a systematic submarine approach where the prospect qualifies themselves.',
  'The Sandler Selling System flips the traditional sales dynamic. Instead of the rep chasing the prospect, the system uses a "submarine" sequence of seven stages where the prospect progressively qualifies themselves. Up-front contracts set mutual expectations, reversing techniques keep the prospect engaged, and the post-sell step prevents buyer''s remorse.',
  'Seven compartments like a submarine: (1) Bonding & Rapport, (2) Up-Front Contract — agree on agenda and outcome, (3) Pain — uncover deep emotional and business pain, (4) Budget — confirm willingness to invest, (5) Decision — map the decision process, (6) Fulfillment — present the solution, (7) Post-Sell — reinforce the decision.',
  'Complex or longer sales cycles where prospects tend to ghost or stall. Useful for volume photography reps dealing with schools and large organizations where decisions involve committees and buyer''s remorse risk is high.',
  '[]'::jsonb,
  '[{"title":"You Can''t Teach a Kid to Ride a Bike at a Seminar","author":"David Sandler","year":2003}]'::jsonb,
  'shield', 'process', 3, 'advanced',
  ARRAY['sandler','submarine','up-front-contract','reversing','pain-funnel','post-sell'],
  'You are a Sandler Selling System coach for volume photography B2B sales. Teach the rep to set up-front contracts at the start of every call (e.g., "If this is not a fit, it is okay to say no"). Guide them through the pain funnel to uncover deep pain behind surface complaints. Emphasize reversing — answering questions with questions. In photography sales, help reps avoid chasing uncommitted prospects by qualifying budget and decision process early.',
  '{}'::jsonb,
  '[{"criterion":"pain_uncovering","weight":0.25,"description":"Rep uses the pain funnel to move from surface issues to core emotional/business pain"},{"criterion":"up_front_contracts","weight":0.20,"description":"Rep sets clear mutual expectations at the start of the conversation"},{"criterion":"reversing","weight":0.20,"description":"Rep answers prospect questions with clarifying questions instead of pitching"},{"criterion":"budget_qualification","weight":0.20,"description":"Rep confirms the prospect is willing and able to invest"},{"criterion":"post_sell","weight":0.15,"description":"Rep reinforces the decision and addresses potential buyer remorse"}]'::jsonb,
  '[{"key":"bonding-rapport","label":"Bonding & Rapport","description":"Build trust and establish a peer-to-peer dynamic"},{"key":"up-front-contract","label":"Up-Front Contract","description":"Set mutual agenda, timeline, and outcome expectations"},{"key":"pain","label":"Pain","description":"Uncover deep business and emotional pain using the pain funnel"},{"key":"budget","label":"Budget","description":"Confirm willingness and ability to invest in a solution"},{"key":"decision","label":"Decision","description":"Map the full decision-making process and stakeholders"},{"key":"fulfillment","label":"Fulfillment","description":"Present the solution only after pain, budget, and decision are confirmed"},{"key":"post-sell","label":"Post-Sell","description":"Reinforce the buying decision and prevent remorse"}]'::jsonb,
  '[{"type":"up_front_contract","example":"Can we agree that at the end of this call, you will tell me honestly if this is or is not a fit?"},{"type":"pain_funnel","example":"You mentioned parents complained about photo quality — can you tell me more about that?"},{"type":"reversing","example":"That is a great question — what prompted you to ask about turnaround time?"}]'::jsonb,
  '{"key_terms":["up-front contract","pain funnel","reversing","submarine","post-sell","negative reverse selling","dummy curve"],"avoid":["let me follow up","I will send you some information","just checking in"]}'::jsonb,
  '[{"pattern":"Presenting the solution before confirming pain, budget, and decision process"},{"pattern":"Chasing prospects with follow-up emails instead of qualifying up front"},{"pattern":"Answering objections with features instead of reversing with questions"}]'::jsonb,
  '[{"signal":"Prospect agrees to an up-front contract and respects it"},{"signal":"Prospect shares emotional reasons behind their business pain"},{"signal":"Prospect voluntarily discloses budget range or decision process"}]'::jsonb,
  '[{"objective":"Master the up-front contract to set expectations on every call"},{"objective":"Practice the pain funnel to move beyond surface-level complaints"},{"objective":"Learn reversing techniques to maintain control of the conversation"}]'::jsonb,
  '[{"chunk":"Pain Funnel","summary":"Sequence of increasingly specific questions moving from surface issues to the emotional and financial core of pain."},{"chunk":"Negative Reverse Selling","summary":"Counterintuitive technique where the rep gently discourages the prospect, causing them to sell themselves on the solution."}]'::jsonb,
  'pro', 'Sandler Selling System is a registered trademark of Sandler Systems, Inc. Used for educational reference.',
  'Sandler, Sandler Method', 8, true
) ON CONFLICT (slug) DO NOTHING;

-- 9. Inbound Selling
INSERT INTO methodologies (
  name, slug, author, tagline, description, how_it_works, best_for,
  videos, books, icon, category, relevance_rating, complexity_level, tags,
  system_prompt_template, feature_prompt_overrides, scoring_rubric, stages,
  question_types, vocabulary, anti_patterns, success_signals,
  learning_objectives, concept_chunks,
  access_tier, trademark_attribution, known_as, sort_order, is_active
) VALUES (
  'Inbound Selling', 'inbound-selling', 'HubSpot',
  'Attract, engage, and delight prospects by helping before selling.',
  'Inbound Selling adapts the inbound marketing philosophy to sales. Reps prioritize the buyer''s context and goals over their own agenda. By identifying where the buyer is in their journey — awareness, consideration, or decision — reps tailor their approach to be genuinely helpful, building trust that converts into long-term partnerships.',
  'Four phases: (1) Identify — find prospects showing buying signals or engagement, (2) Connect — reach out with personalized context, not a generic pitch, (3) Explore — understand goals, challenges, and timeline collaboratively, (4) Advise — present a tailored recommendation that fits the buyer''s situation.',
  'Reps selling to prospects who have already shown interest (visited website, engaged on social media, attended an event). Ideal for volume photography reps finding leads through dance studio social media, Skool community, or referrals — where the prospect is already warm.',
  '[]'::jsonb, '[]'::jsonb,
  'magnet', 'process', 3, 'beginner',
  ARRAY['inbound','buyer-journey','helpful-selling','trust','context'],
  'You are an Inbound Selling coach for volume photography B2B sales. Teach the rep to approach prospects based on context — social media posts, events they are planning, pain expressed publicly. Guide the rep to be helpful first: share tips, case studies, or ideas before asking for anything. In photography sales, help studio owners see how better photography can increase their revenue, rather than cold-pitching. Emphasize personalization and buyer-journey awareness.',
  '{}'::jsonb,
  '[{"criterion":"buyer_context","weight":0.25,"description":"Rep demonstrates knowledge of the prospect''s situation and buyer journey stage"},{"criterion":"helpfulness","weight":0.30,"description":"Rep provides genuine value before asking for commitment"},{"criterion":"exploration_depth","weight":0.25,"description":"Rep collaboratively explores the prospect''s goals and challenges"},{"criterion":"advice_quality","weight":0.20,"description":"Rep delivers a tailored recommendation, not a generic pitch"}]'::jsonb,
  '[{"key":"identify","label":"Identify","description":"Find prospects showing buying signals or active engagement"},{"key":"connect","label":"Connect","description":"Reach out with personalized, context-aware messaging"},{"key":"explore","label":"Explore","description":"Collaboratively understand goals, challenges, and timeline"},{"key":"advise","label":"Advise","description":"Present a tailored recommendation based on what was explored"}]'::jsonb,
  '[{"type":"context","example":"I saw your studio posted about your spring recital — how are you handling photography for that event?"},{"type":"exploratory","example":"What are your goals for parent engagement at your next picture day?"},{"type":"advisory","example":"Studios like yours typically see a 30% increase in photo sales with same-week delivery — would that be valuable?"}]'::jsonb,
  '{"key_terms":["buyer journey","awareness stage","consideration stage","decision stage","context","personalization","helpful selling"],"avoid":["just wanted to touch base","circling back","I know you are busy but"]}'::jsonb,
  '[{"pattern":"Sending generic outreach with no personalization or context"},{"pattern":"Pushing for a meeting before providing any value"},{"pattern":"Ignoring the buyer''s journey stage and pitching too early"}]'::jsonb,
  '[{"signal":"Prospect responds positively to personalized outreach"},{"signal":"Prospect shares their goals and challenges openly"},{"signal":"Prospect asks for your recommendation or proposal"}]'::jsonb,
  '[{"objective":"Research prospects and personalize every touchpoint"},{"objective":"Lead with value and helpfulness before making an ask"},{"objective":"Read buyer-journey signals in photography sales contexts"}]'::jsonb,
  '[{"chunk":"Buyer Journey Alignment","summary":"Match your sales approach to the prospect''s current stage — awareness, consideration, or decision."},{"chunk":"Contextual Outreach","summary":"Craft personalized first messages using public signals like social media posts, event announcements, or community engagement."}]'::jsonb,
  'pro', 'Inbound Selling is a methodology associated with HubSpot, Inc. Used for educational reference.',
  'Inbound Sales, HubSpot Sales Method', 9, true
) ON CONFLICT (slug) DO NOTHING;
