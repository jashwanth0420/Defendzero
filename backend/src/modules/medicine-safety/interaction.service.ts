import {
  FullInteractionTypeGroup,
  FullInteractionType,
  InteractionPair,
  RxNavClient
} from '../../clients/rxnav.client';
import { SafetyInteraction } from './safety.types';

export class InteractionService {
  constructor(private readonly rxNavClient: RxNavClient = new RxNavClient()) {}

  public async getStructuredInteractions(rxcuis: string[]): Promise<{
    interactionChecked: boolean;
    interactions: SafetyInteraction[];
  }> {
    if (rxcuis.length < 2) {
      return {
        interactionChecked: false,
        interactions: []
      };
    }

    const interactionGroups = await this.rxNavClient.getInteractionsByRxCuis(rxcuis);

    return {
      interactionChecked: true,
      interactions: this.flattenInteractions(interactionGroups)
    };
  }

  private flattenInteractions(groups: FullInteractionTypeGroup[]): SafetyInteraction[] {
    const output: SafetyInteraction[] = [];

    for (const group of groups) {
      for (const interactionType of group.fullInteractionType ?? []) {
        output.push(...this.mapInteractionType(interactionType));
      }
    }

    return output;
  }

  private mapInteractionType(interactionType: FullInteractionType): SafetyInteraction[] {
    const source = interactionType.sourceName ?? 'unknown-source';
    const mapped: SafetyInteraction[] = [];

    for (const pair of interactionType.interactionPair ?? []) {
      mapped.push(this.mapInteractionPair(source, pair));
    }

    return mapped;
  }

  private mapInteractionPair(source: string, pair: InteractionPair): SafetyInteraction {
    const concepts = pair.interactionConcept ?? [];
    const medicineA = concepts[0]?.minConceptItem?.name ?? 'unknown';
    const medicineB = concepts[1]?.minConceptItem?.name ?? 'unknown';

    return {
      source,
      pair: [medicineA, medicineB],
      description: pair.description ?? 'No description provided by source API',
      severity: pair.severity ?? 'UNKNOWN'
    };
  }
}
