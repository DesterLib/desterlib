import { Router } from "express";
import { settingsControllers } from "./settings.controller";
import { validate } from "../../lib/middleware";
import { updateSettingsSchema, getSettingsSchema } from "./settings.types";

const router: Router = Router();

// GET /api/v1/settings - Get current settings
router.get("/", validate(getSettingsSchema, "query"), settingsControllers.get);

// PUT /api/v1/settings - Update settings
router.put(
  "/",
  validate(updateSettingsSchema, "body"),
  settingsControllers.update
);

// POST /api/v1/settings/first-run-complete - Complete first run setup
router.post("/first-run-complete", settingsControllers.completeFirstRun);

export default router;
