import { RxNavClient, RxNormDrugConceptProperty } from '../../clients/rxnav.client';

export interface MedicineSearchItem {
  name: string;
  generic_name: string;
  brand_name: string;
}

export class MedicineSearchService {
  constructor(private readonly rxNavClient: RxNavClient = new RxNavClient()) {}

  public async search(query: string): Promise<MedicineSearchItem[]> {
    const concepts = await this.rxNavClient.searchDrugsByName(query);
    return this.simplify(concepts);
  }

  private simplify(concepts: RxNormDrugConceptProperty[]): MedicineSearchItem[] {
    const output: MedicineSearchItem[] = [];
    const seen = new Set<string>();

    for (const concept of concepts) {
      const name = concept.name?.trim();
      if (!name) {
        continue;
      }

      const key = `${concept.rxcui ?? 'unknown'}:${name.toLowerCase()}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const tty = (concept.tty ?? '').toUpperCase();
      const isBrand = tty.startsWith('S') || tty === 'BN';
      const generic = (concept.synonym || name).trim();

      output.push({
        name,
        generic_name: isBrand ? generic : name,
        brand_name: isBrand ? name : ''
      });

      if (output.length >= 20) {
        break;
      }
    }

    return output;
  }
}
