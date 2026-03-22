import { DailyMedClient } from '../../clients/dailymed.client';
import { FdaClient, OpenFdaDrugLabelResult } from '../../clients/fda.client';
import { RxNavClient } from '../../clients/rxnav.client';
import { CompositionMatch, MedicineEntry, MedicineVerificationResult } from './safety.types';

type PregnancySuitability = MedicineVerificationResult['pregnancySafety'];

export class LegitimacyService {
  constructor(
    private readonly fdaClient: FdaClient = new FdaClient(),
    private readonly dailyMedClient: DailyMedClient = new DailyMedClient(),
    private readonly rxNavClient: RxNavClient = new RxNavClient()
  ) {}

  public async checkMedicineLegitimacy(
    entry: MedicineEntry,
    rxnormRxcui: string | null,
    normalizedName: string
  ): Promise<MedicineVerificationResult> {
    const normalized = normalizedName.trim() || entry.name.trim();
    const rxnormIngredients = rxnormRxcui ? await this.rxNavClient.getIngredientsByRxCui(rxnormRxcui) : [];
    const compositionMatch = this.computeCompositionMatch(entry.composition, rxnormIngredients);

    const [fdaByName, fdaByGeneric] = await Promise.all([
      this.fdaClient.findDrugLabelByName(entry.name),
      this.fdaClient.findDrugLabelByGenericName(normalized)
    ]);

    const fdaLabel = fdaByName ?? fdaByGeneric;
    let dailymedText: string | null = null;

    if (!fdaLabel) {
      dailymedText = await this.dailyMedClient.findLabelTextByDrugName(normalized);
    }

    const combinedText = this.extractLabelText(fdaLabel ? [fdaLabel] : []) + (dailymedText ? ` ${dailymedText}` : '');

    const pregnancySafety = this.inferPregnancySuitability(combinedText);

    const sourceFlags = {
      rxnorm: Boolean(rxnormRxcui),
      fda: Boolean(fdaLabel),
      dailymed: Boolean(dailymedText)
    };

    const nameMatchScore = this.computeNameMatchScore(entry.name, normalized);
    const legitimacyScore = this.computeLegitimacyScore({
      hasRxNorm: sourceFlags.rxnorm,
      compositionMatch,
      hasLabelSource: sourceFlags.fda || sourceFlags.dailymed,
      nameMatchScore
    });

    const legitimacyStatus =
      legitimacyScore >= 80 ? 'VERIFIED' : legitimacyScore >= 50 ? 'PARTIAL' : 'NOT_VERIFIED';

    return {
      name: entry.name,
      normalizedName: normalized,
      rxcui: rxnormRxcui,
      compositionMatch,
      sources: sourceFlags,
      legitimacyScore,
      legitimacyStatus,
      pregnancySafety,
      notes: this.buildNotes(entry, rxnormIngredients, sourceFlags, pregnancySafety)
    };
  }

  private extractLabelText(labels: Array<OpenFdaDrugLabelResult | null>): string {
    return labels
      .filter((label): label is OpenFdaDrugLabelResult => Boolean(label))
      .flatMap((label) => [
        ...(label.pregnancy ?? []),
        ...(label.warnings ?? []),
        ...(label.contraindications ?? []),
        ...(label.precautions ?? [])
      ])
      .join(' ')
      .toLowerCase();
  }

  private inferPregnancySuitability(text: string): PregnancySuitability {
    if (!text) {
      return 'UNKNOWN';
    }

    if (
      /contraindicat|pregnancy category\s*x|pregnancy category\s*d|fetal harm|teratogenic|avoid use in pregnancy|not recommended in pregnancy/i.test(
        text
      )
    ) {
      return 'UNSAFE';
    }

    if (/pregnancy category\s*a|pregnancy category\s*b|no evidence of risk/i.test(text)) {
      return 'SAFE';
    }

    if (/pregnancy category\s*c|use only if clearly needed|consult|use with caution|risk cannot be ruled out/i.test(text)) {
      return 'CAUTION';
    }

    return 'UNKNOWN';
  }

  private normalizeText(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private fuzzyMatch(a: string, b: string): boolean {
    const left = this.normalizeText(a);
    const right = this.normalizeText(b);

    if (!left || !right) {
      return false;
    }

    if (left === right || left.includes(right) || right.includes(left)) {
      return true;
    }

    const leftTokens = new Set(left.split(' '));
    const rightTokens = new Set(right.split(' '));
    const intersection = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
    const union = new Set([...leftTokens, ...rightTokens]).size;
    const similarity = union === 0 ? 0 : intersection / union;

    return similarity >= 0.5;
  }

  private computeCompositionMatch(userComposition: string[], rxnormIngredients: string[]): CompositionMatch {
    if (rxnormIngredients.length === 0 || userComposition.length === 0) {
      return 'NO_MATCH';
    }

    const matchedCount = userComposition.filter((item) => rxnormIngredients.some((rx) => this.fuzzyMatch(item, rx))).length;

    if (matchedCount === userComposition.length) {
      return 'EXACT_MATCH';
    }

    if (matchedCount > 0) {
      return 'PARTIAL_MATCH';
    }

    return 'NO_MATCH';
  }

  private computeNameMatchScore(name: string, normalizedName: string): number {
    return this.fuzzyMatch(name, normalizedName) ? 10 : 0;
  }

  private computeLegitimacyScore(params: {
    hasRxNorm: boolean;
    compositionMatch: CompositionMatch;
    hasLabelSource: boolean;
    nameMatchScore: number;
  }): number {
    const rxnormScore = params.hasRxNorm ? 40 : 0;
    const compositionScore =
      params.compositionMatch === 'EXACT_MATCH' ? 30 : params.compositionMatch === 'PARTIAL_MATCH' ? 15 : 0;
    const labelScore = params.hasLabelSource ? 20 : 0;
    const nameScore = params.nameMatchScore;

    return Math.max(0, Math.min(100, rxnormScore + compositionScore + labelScore + nameScore));
  }

  private buildNotes(
    entry: MedicineEntry,
    rxnormIngredients: string[],
    sources: { rxnorm: boolean; fda: boolean; dailymed: boolean },
    pregnancySuitability: PregnancySuitability
  ): string[] {
    const notes: string[] = [];

    if (!sources.rxnorm) {
      notes.push('RxNorm did not return an RxCUI for the entered medicine.');
    }

    if (!sources.fda && !sources.dailymed) {
      notes.push('No label data was found in OpenFDA or DailyMed.');
    }

    if (rxnormIngredients.length === 0) {
      notes.push('RxNorm ingredient relationship data was unavailable for this medicine.');
    }

    if (pregnancySuitability === 'UNKNOWN') {
      notes.push('Pregnancy suitability is unknown from available public label text.');
    }

    return notes;
  }
}
