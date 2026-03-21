import { prisma } from '../../config/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const TOKEN_SECRET = process.env.JWT_SECRET || 'super_secret_defendzero_key';

export interface PurchaseTokenPayload {
  jti: string; // Unique Token ID (could be prescription ID)
  patientId: string;
  medicineId: string;
  maxQuantity: number;
  // iat and exp are handled by jwt
}

export class PharmacyService {
  /**
   * Securely generates a signed purchase token.
   * Can be initiated from a Doctor's Prescription or a validated OTC limit system.
   */
  public async generatePurchaseToken(
    patientId: string,
    medicineId: string,
    maxQuantity: number,
    expiresInHours: number = 72 // Tokens expire after 72 hours
  ): Promise<string> {
    
    // Verify patient and medicine exist before signing
    const [patient, medicine] = await Promise.all([
      prisma.user.findUnique({ where: { id: patientId } }),
      prisma.medicine.findUnique({ where: { id: medicineId } })
    ]);

    if (!patient || !medicine) {
      throw new Error('Invalid Patient ID or Medicine ID');
    }

    const payload: PurchaseTokenPayload = {
      jti: crypto.randomUUID(), // Create unique transaction boundary identifier
      patientId,
      medicineId,
      maxQuantity
    };

    const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: `${expiresInHours}h` });
    return token;
  }

  /**
   * Validates a token submitted by a PHARMACY and logs the purchase securely,
   * completely preventing over-purchasing against the token's initial allowance limit.
   */
  public async processPurchase(
    pharmacyId: string,
    token: string,
    requestedQuantity: number
  ): Promise<any> {
    
    if (requestedQuantity <= 0) {
       throw new Error('Purchase quantity must be greater than zero.');
    }

    // 1. Verify and decode signature strictly
    let decoded: PurchaseTokenPayload;
    try {
      decoded = jwt.verify(token, TOKEN_SECRET) as PurchaseTokenPayload;
    } catch (err: any) {
      throw new Error(`Token validation failed: ${err.message}`);
    }

    const { jti, patientId, medicineId, maxQuantity } = decoded;

    // 2. Prevent Over-Purchase (Query Database Logs)
    // We sum all historical purchases generated from this precise unique Token ID (`jti`)
    // Because we used 'jti', patients cannot reuse the same token indefinitely across 50 pharmacies.
    // NOTE: You would typically add a `tokenId` String field directly into `PurchaseLog` to do this precisely.
    // For now, since `PurchaseLog` just correlates patient/medicine/date, we sum ALL purchases of this medicine 
    // for this patient within the 72 hour expiry window to prevent generalized over-purchase limit evasion.

    const dateBoundary = new Date(Date.now() - (72 * 60 * 60 * 1000)); // 72 hours ago
    
    const historicalPurchases = await prisma.purchaseLog.aggregate({
       where: {
         patientId: patientId,
         medicineId: medicineId,
         purchasedAt: { gte: dateBoundary }
       },
       _sum: {
         quantity: true
       }
    });

    const totalPurchasedRecently = historicalPurchases._sum.quantity || 0;
    const remainingAllowance = maxQuantity - totalPurchasedRecently;

    if (requestedQuantity > remainingAllowance) {
       throw new Error(`OVER-PURCHASE PREVENTED. Token allows max ${maxQuantity}. Patient has already purchased ${totalPurchasedRecently} recently. Only ${remainingAllowance} remaining.`);
    }

    // 3. Process the explicit authorized purchase logging
    const purchase = await prisma.purchaseLog.create({
      data: {
         patientId,
         medicineId,
         pharmacyId,
         quantity: requestedQuantity,
      }
    });

    return {
      success: true,
      data: purchase,
      status: `Successfully authorized drop for ${requestedQuantity} units.`,
      allowanceRemaining: remainingAllowance - requestedQuantity
    };
  }

  // --- NEW: Medical Shop CRUD Operations ---

  public async getAllPharmacies() {
    return await prisma.user.findMany({
      where: { role: 'PHARMACY' },
      select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          storeName: true,
          createdAt: true
      }
    });
  }

  public async createPharmacy(data: any) {
    const { email, name, storeName, password } = data;
    const hashedPassword = await bcrypt.hash(password || 'Shop@123', 10);
    
    // In our model, a shop is a User with Role.PHARMACY
    return await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: name,
        lastName: 'Pharmacy',
        storeName,
        role: 'PHARMACY'
      }
    });
  }

  public async updatePharmacy(id: string, data: any) {
    return await prisma.user.update({
      where: { id, role: 'PHARMACY' },
      data: {
        firstName: data.name,
        storeName: data.storeName,
        email: data.email
      }
    });
  }

  public async deletePharmacy(id: string) {
    return await prisma.user.delete({
      where: { id, role: 'PHARMACY' }
    });
  }
}
