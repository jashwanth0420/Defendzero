import { prisma } from '../../config/prisma';
import { InteractionSeverity, PregnancyRiskLevel } from '@prisma/client';

export interface MedicineIds {
  targetMedicineId: string;
  currentMedicineIds: string[];
}

export interface PatientProfile {
  isPregnant: boolean;
  trimester?: 1 | 2 | 3 | null;
}

export type SafetyLevel = 'SAFE' | 'CAUTION' | 'CONTRAINDICATED' | 'DANGER';

export interface Explanation {
  rule: string;
  description: string;
  severity: SafetyLevel;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  overallLevel: SafetyLevel;
  explanations: Explanation[];
}

export class SafetyEngineService {
  /**
   * Deterministic logic safely connecting to PostgreSQL to avoid mock logic
   */
  public async evaluateSafety(req: MedicineIds, profile?: PatientProfile): Promise<SafetyCheckResult> {
    const explanations: Explanation[] = [];
    let overallLevel: SafetyLevel = 'SAFE';

    const severityScores = { SAFE: 0, CAUTION: 1, DANGER: 2, CONTRAINDICATED: 3 };
    const applySeverity = (level: SafetyLevel) => {
      if (severityScores[level] > severityScores[overallLevel]) {
        overallLevel = level;
      }
    };

    // 1. Fetch exact ingredients dynamically from the mapping table
    const targetIngredientsQuery = await prisma.medicineIngredient.findMany({
      where: { medicineId: req.targetMedicineId },
      include: { ingredient: true }
    });
    
    const currentIngredientsQuery = await prisma.medicineIngredient.findMany({
      where: { medicineId: { in: req.currentMedicineIds } },
      include: { ingredient: true }
    });

    const targetIngredients = targetIngredientsQuery.map(mi => mi.ingredient);
    const currentIngredients = currentIngredientsQuery.map(mi => mi.ingredient);

    // Rule A: Duplicate Ingredients (Overdose protection)
    for (const targetIng of targetIngredients) {
      if (currentIngredients.some(c => c.id === targetIng.id)) {
        explanations.push({
          rule: 'DUPLICATE_INGREDIENT',
          description: `Risk of overdose: You are already taking a medication containing '${targetIng.name}'.`,
          severity: 'DANGER'
        });
        applySeverity('DANGER');
      }
    }

    // Rule B: Drug Interactions
    for (const targetIng of targetIngredients) {
      for (const currIng of currentIngredients) {
        // Query explicit relationships defined dynamically in DB
        const interaction = await prisma.drugInteraction.findFirst({
          where: {
             OR: [
               { ingredientAId: targetIng.id, ingredientBId: currIng.id },
               { ingredientAId: currIng.id, ingredientBId: targetIng.id }
             ]
          }
        });

        if (interaction) {
          explanations.push({
            rule: 'DRUG_INTERACTION',
            description: interaction.description,
            severity: interaction.severity as SafetyLevel
          });
          applySeverity(interaction.severity as SafetyLevel);
        }
      }
    }

    // Rule C: Antibiotic Misuse Vectors (Driven by strict Postgres flag)
    const targetIsAntibiotic = targetIngredients.some(i => i.isAntibiotic);
    const currentAntibioticsCount = currentIngredients.filter(i => i.isAntibiotic).length;
    
    if (targetIsAntibiotic && currentAntibioticsCount > 0) {
      explanations.push({
        rule: 'ANTIBIOTIC_OVERLAP_WARNING',
        description: 'You are attempting to take multiple overlapping antibiotics simultaneously. This requires explicit physician authorization.',
        severity: 'CONTRAINDICATED'
      });
      applySeverity('CONTRAINDICATED');
    }

    // Rule D: Pregnancy Risk Deterministic Bounds
    if (profile?.isPregnant) {
      const trimester = profile.trimester || null;

      for (const targetIng of targetIngredients) {
         // Query the DB explicitly for this ingredient's pregnancy profiles
         const pRules = await prisma.pregnancyRisk.findMany({
           where: { ingredientId: targetIng.id }
         });

         if (pRules.length > 0) {
            // Find EXACT trimester rule OR Fallback to global "All Trimesters"
            const specificRisk = pRules.find(r => r.trimester === trimester) || pRules.find(r => r.trimester === null);
            
            if (specificRisk) {
               explanations.push({
                 rule: trimester ? `PREGNANCY_RISK_TRIMESTER_${trimester}` : 'PREGNANCY_RISK_WORST_CASE',
                 description: specificRisk.description,
                 severity: specificRisk.riskLevel as SafetyLevel
               });
               applySeverity(specificRisk.riskLevel as SafetyLevel);
            } else {
               // Fallback: Patient didn't provide a Trimester, and no "All Trimester (null)" generic risk was registered.
               // We must loop ALL registered trimesters in the DB for this drug, and isolate the MOST dangerous one.
               let worstSeverity: SafetyLevel = 'SAFE';
               let worstDesc = '';

               for (const r of pRules) {
                 if (severityScores[r.riskLevel as SafetyLevel] > severityScores[worstSeverity]) {
                    worstSeverity = r.riskLevel as SafetyLevel;
                    worstDesc = `Worst-case fallback safety cap (trimester unknown): ${r.description}`;
                 }
               }
               explanations.push({ rule: 'PREGNANCY_RISK_WORST_CASE', description: worstDesc, severity: worstSeverity });
               applySeverity(worstSeverity);
            }
         } else {
            explanations.push({
               rule: 'PREGNANCY_UNTESTED',
               description: `Ingredient '${targetIng.name}' lacks verified clinical safety clearance during pregnancy.`,
               severity: 'CAUTION'
            });
            applySeverity('CAUTION');
         }
      }
    }

    return {
      isSafe: overallLevel === 'SAFE',
      overallLevel,
      explanations
    };
  }
}
