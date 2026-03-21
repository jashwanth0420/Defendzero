import { Router } from 'express';
import { PharmacyController } from './pharmacy.controller';

const router = Router();
const pharmacyController = new PharmacyController();

// Note: authenticateJWT and requirePharmacy are already applied at parent level in v1/index.ts

// 1. Pharmacy Purchase Transaction Endpoint
router.post('/process-purchase', pharmacyController.verifyAndPurchase);

// 2. Pharmacy Information Retrieval
router.get('/', pharmacyController.getAll);

export default router;
