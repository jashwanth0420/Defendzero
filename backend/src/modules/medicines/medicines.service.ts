import { prisma } from '../../config/prisma';

export class MedicinesService {
  /**
   * Search medicines directly against the PostgreSQL database.
   * STRICT RULE: Uses Prisma. No mock files.
   */
  public async searchMedicines(query: string, limit: number = 10): Promise<any[]> {
    if (!query || query.trim().length === 0) {
      // Return un-scored full list if empty
      const results = await prisma.medicine.findMany({
        take: limit,
        include: { ingredients: { include: { ingredient: true } } }
      });
      if (!results.length) throw new Error('No medicines found in database.');
      return results;
    }

    const searchTerm = `%${query.trim()}%`;

    // Query Postgres using Prisma for partial matching on name or description
    const results = await prisma.medicine.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          {
            ingredients: {
              some: {
                ingredient: {
                  name: { contains: query, mode: 'insensitive' }
                }
              }
            }
          }
        ]
      },
      take: limit,
      include: {
        ingredients: {
          include: { ingredient: true }
        }
      }
    });

    if (!results.length) {
      throw new Error(`No medicines found matching query: ${query}`);
    }

    return results;
  }
}
