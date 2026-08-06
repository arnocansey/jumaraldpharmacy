import { Router } from "express";
import { searchMedicines, searchBySymptoms, getAlternatives, getPopularSearches, getSearchSuggestions } from "../controllers/search.controller";

const router = Router();

router.get("/", searchMedicines);
router.get("/symptoms", searchBySymptoms);
router.get("/suggestions", getSearchSuggestions);
router.get("/popular", getPopularSearches);
router.get("/alternatives/:productId", getAlternatives);

export default router;
