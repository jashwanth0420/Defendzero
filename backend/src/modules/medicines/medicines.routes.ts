import { Router } from 'express';
import { MedicinesController } from './medicines.controller';

const router = Router();
const medicinesController = new MedicinesController();

// Note: authenticateJWT and requireUser are already applied at parent level in v1/index.ts
// Core Fuzzy Search
router.get('/search', medicinesController.search);

export default router;
