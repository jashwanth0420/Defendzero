export type PregnancyStage = 'first' | 'second' | 'third' | 'unknown';

export interface MedicineEntry {
  name: string;
  composition: string[];
}

export interface SafetyCheckRequest {
  medicines?: string[];
  medicineEntries?: MedicineEntry[];
  pregnancyStage?: PregnancyStage;
}

export interface RxNormResult {
  medicine: string;
  normalizedName: string;
  rxcui: string | null;
}

export interface SafetyInteraction {
  source: string;
  pair: [string, string];
  description: string;
  severity: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type CompositionMatch = 'EXACT_MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH';

export interface MedicineVerificationResult {
  name: string;
  normalizedName: string;
  rxcui: string | null;
  compositionMatch: CompositionMatch;
  sources: {
    rxnorm: boolean;
    fda: boolean;
    dailymed: boolean;
  };
  legitimacyScore: number;
  legitimacyStatus: 'VERIFIED' | 'PARTIAL' | 'NOT_VERIFIED';
  pregnancySafety: 'SAFE' | 'CAUTION' | 'UNSAFE' | 'UNKNOWN';
  notes: string[];
}

export interface SafetyCheckResponse {
  medicines: string[];
  medicineEntries: MedicineEntry[];
  rxcuis: RxNormResult[];
  interactions: SafetyInteraction[];
  legitimacyChecks: MedicineVerificationResult[];
  risk: RiskLevel;
  alerts: string[];
  meta: {
    rxnormResolved: number;
    fdaVerified: number;
    dailymedVerified: number;
    interactionChecked: boolean;
  };
}
