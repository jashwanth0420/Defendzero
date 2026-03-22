import { InteractionService } from './interaction.service';
import { LegitimacyService } from './legitimacy.service';
import { RxNormService } from './rxnorm.service';
import {
  MedicineEntry,
  PregnancyStage,
  RiskLevel,
  RxNormResult,
  SafetyCheckRequest,
  SafetyCheckResponse,
  SafetyInteraction
} from './safety.types';

const ANTIBIOTIC_WATCHLIST = new Set(['amoxicillin', 'azithromycin', 'ciprofloxacin']);

export class SafetyEngineService {
  constructor(
    private readonly rxNormService: RxNormService = new RxNormService(),
    private readonly interactionService: InteractionService = new InteractionService(),
    private readonly legitimacyService: LegitimacyService = new LegitimacyService()
  ) {}

  public async runSafetyCheck(request: SafetyCheckRequest): Promise<SafetyCheckResponse> {
    const medicineEntries = this.normalizeEntries(request);
    const medicines = medicineEntries.map((entry) => entry.name);
    const pregnancyStage = request.pregnancyStage ?? 'unknown';

    const rxnormMapping = await this.rxNormService.resolveRxCuis(medicines);
    const validRxcuis = this.getValidRxcuis(rxnormMapping);

    const interactionResult = await this.interactionService.getStructuredInteractions(validRxcuis);
    const legitimacyChecks = await this.buildLegitimacyChecks(medicineEntries, rxnormMapping);

    const alerts = this.buildAlerts(medicines, pregnancyStage, legitimacyChecks);
    const risk = this.computeRisk(interactionResult.interactions, alerts, legitimacyChecks);

    return {
      medicines,
      medicineEntries,
      rxcuis: rxnormMapping,
      interactions: interactionResult.interactions,
      legitimacyChecks,
      risk,
      alerts,
      meta: {
        rxnormResolved: validRxcuis.length,
        fdaVerified: legitimacyChecks.filter((item) => item.sources.fda).length,
        dailymedVerified: legitimacyChecks.filter((item) => item.sources.dailymed).length,
        interactionChecked: interactionResult.interactionChecked
      }
    };
  }

  private normalizeEntries(request: SafetyCheckRequest): MedicineEntry[] {
    if (request.medicineEntries && request.medicineEntries.length > 0) {
      return request.medicineEntries;
    }

    return (request.medicines ?? []).map((name) => ({
      name,
      composition: [name]
    }));
  }

  private async buildLegitimacyChecks(entries: MedicineEntry[], rxnormMapping: RxNormResult[]) {
    return Promise.all(
      entries.map(async (entry, index) => {
        const rxcui = rxnormMapping[index]?.rxcui ?? null;
        const normalizedName = rxnormMapping[index]?.normalizedName ?? entry.name;
        return this.legitimacyService.checkMedicineLegitimacy(entry, rxcui, normalizedName);
      })
    );
  }

  private getValidRxcuis(rxnormMapping: RxNormResult[]): string[] {
    return rxnormMapping
      .map((item) => item.rxcui)
      .filter((value): value is string => Boolean(value));
  }

  private buildAlerts(
    medicines: string[],
    pregnancyStage: PregnancyStage,
    legitimacyChecks: SafetyCheckResponse['legitimacyChecks']
  ): string[] {
    const alerts: string[] = [];
    const normalized = medicines.map((medicine) => medicine.trim().toLowerCase());

    if (this.hasDuplicates(normalized)) {
      alerts.push('Duplicate medicines detected. Verify doses to avoid accidental overlap.');
    }

    if (pregnancyStage === 'unknown') {
      alerts.push('Pregnancy stage is unknown. Worst-case safety handling has been applied.');
    }

    const flaggedAntibiotics = normalized.filter((medicine) => ANTIBIOTIC_WATCHLIST.has(medicine));
    if (flaggedAntibiotics.length > 0) {
      alerts.push(`Antibiotic misuse caution: ${flaggedAntibiotics.join(', ')} should be used only with medical guidance.`);
    }

    const notVerified = legitimacyChecks
      .filter((check) => check.legitimacyStatus === 'NOT_VERIFIED')
      .map((check) => check.name);
    if (notVerified.length > 0) {
      alerts.push(`Multi-source legitimacy not verified for: ${notVerified.join(', ')}.`);
    }

    const pregnancyUnsafe = legitimacyChecks
      .filter((check) => check.pregnancySafety === 'UNSAFE')
      .map((check) => check.name);
    if (pregnancyUnsafe.length > 0) {
      alerts.push(`Unsafe in pregnancy based on public label signals: ${pregnancyUnsafe.join(', ')}.`);
    }

    return alerts;
  }

  private hasDuplicates(values: string[]): boolean {
    return new Set(values).size !== values.length;
  }

  private computeRisk(
    interactions: SafetyInteraction[],
    alerts: string[],
    legitimacyChecks: SafetyCheckResponse['legitimacyChecks']
  ): RiskLevel {
    if (interactions.length > 0) {
      return 'HIGH';
    }

    if (legitimacyChecks.some((check) => check.pregnancySafety === 'UNSAFE')) {
      return 'HIGH';
    }

    if (alerts.length > 0) {
      return 'MEDIUM';
    }

    return 'LOW';
  }
}
