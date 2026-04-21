/**
 * Shared clinical-term validator + wellness-safety escalation primitives.
 *
 * Per Build Spec §5.3 and §7.3, every LLM output that reaches the user must
 * pass through this validator. If it trips, retry once with a stricter
 * system prompt; if it trips again, fall back to ESCALATION_TEMPLATE.
 *
 * See Build Spec §5.5 for the exact escalation template wording.
 */

export const FORBIDDEN_TERMS = [
  'rosacea', 'melasma', 'eczema', 'psoriasis', 'dermatitis',
  'atopic', 'cystic acne', 'fungal acne', 'keratosis pilaris',
  'perioral', 'post-inflammatory', 'PIH', 'PIE', 'comedones',
  'hirsutism', 'alopecia', 'melanoma', 'seborrheic',
  'seboroik', 'folliculitis', 'malassezia', 'xerosis',
  'acne vulgaris', 'nodular acne',
] as const;

export type ForbiddenTerm = (typeof FORBIDDEN_TERMS)[number];

export interface ValidationResult {
  valid: boolean;
  violations: string[];
}

/** Case-insensitive substring match against the forbidden-term list. */
export function validateAIOutput(text: string): ValidationResult {
  if (!text) return { valid: true, violations: [] };
  const lower = text.toLowerCase();
  const hits = FORBIDDEN_TERMS.filter((t) => lower.includes(t.toLowerCase()));
  return hits.length > 0
    ? { valid: false, violations: [...hits] }
    : { valid: true, violations: [] };
}

/**
 * Replace each forbidden term with the neutral phrase "kondisi kulit."
 * Regex flag `gi` = global + case-insensitive. Intended for the analyze-photo
 * route which already has a structured JSON response — safe to string-replace.
 * Not appropriate for free-form chat where an in-place swap produces awkward
 * sentences; chat should use ESCALATION_TEMPLATE instead.
 */
export function scrubForbiddenTerms(text: string, violations: string[]): string {
  if (!violations.length) return text;
  let out = text;
  for (const term of violations) {
    // Escape regex special chars in the term itself
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(escaped, 'gi'), 'kondisi kulit');
  }
  return out;
}

/**
 * Standard escalation message (Bahasa Indonesia), quoted verbatim from
 * Build Spec §5.5. Used when the coach detects a §5.4 escalation trigger
 * OR when the clinical-term validator fails twice.
 *
 * The chat UI renders a "Booking Haloskin →" CTA alongside this text when
 * `escalation.needed === true` on the coach response.
 */
export const ESCALATION_TEMPLATE =
  'Hmm, yang kamu ceritain kedengarannya butuh dilihat langsung sama ' +
  'dermatologist biar dapat pemeriksaan dan saran yang tepat. Aku bisa ' +
  'bantu kasih info umum dan rekomendasi produk basic, tapi untuk kondisi ' +
  'kayak gini, konsultasi dokter lebih aman ya. Mau aku bantu booking ' +
  'konsultasi online lewat Haloskin (Halodoc)? Biasanya Rp 25.000–50.000 ' +
  'per konsultasi dan kamu bisa dapat jawaban dari dokter beneran dalam ' +
  'hitungan jam.';

/**
 * Haloskin (Halodoc) booking URL. Used in the chat escalation CTA.
 * Placeholder until a formal partnership with deep-link lands —
 * for now we link to the public Halodoc skincare entry point.
 */
export const HALOSKIN_URL = 'https://www.halodoc.com/';

/**
 * Categories of messages that MUST trigger escalation (Build Spec §5.4).
 * Injected into the coach system prompt so Gemini marks
 * `escalation.needed = true` when a user message matches any of these.
 */
export const ESCALATION_TRIGGER_CATEGORIES = [
  'Deep, painful, or pus-filled breakouts; cysts; rapid worsening; 6+ weeks no improvement',
  'Sudden mole changes; unusual bumps; lesions that do not heal; severe allergic reactions',
  'Direct medical questions ("Apakah aku punya [kondisi]?"); requests for prescription dosage',
  'Pregnancy or breastfeeding + specific ingredient safety questions',
  'Known medical condition or currently on specific medications',
  'GLP-1 / Ozempic / Wegovy / Mounjaro / Saxenda questions',
  'BMI ≥ 30 with comorbidities; suspected eating disorder',
] as const;
