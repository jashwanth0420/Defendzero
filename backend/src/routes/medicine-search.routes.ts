import { Router } from 'express';
import { MedicineSearchController } from '../modules/medicine-search/medicine-search.controller';

const medicineSearchRouter = Router();
const controller = new MedicineSearchController();

medicineSearchRouter.get('/search', controller.search);

export default medicineSearchRouter;
