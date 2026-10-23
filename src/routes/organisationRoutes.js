const express = require("express");
const router = express.Router();
const orgController = require("../controllers/organisationController");
const statsController = require("../controllers/statsController");
const standingsController = require("../controllers/standingsController");
const {
  verifyToken,
  restrictToAdmin,
  restrictToOwnOrg,
} = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", orgController.getAllOrganisations);
router.get("/:organisationId", orgController.getOrganisation);
router.get("/:organisationId/stats", statsController.getOrganisationStats);
// standings and stats across the organisation's finished events, one
// row per person (read-auth like the per-event standings)
router.get(
  "/:organisationId/standings/speakers",
  standingsController.getOrganisationSpeakerStandings,
);
router.get(
  "/:organisationId/stats/adjudicators",
  statsController.getOrganisationAdjudicatorStats,
);

router.post("/", restrictToAdmin, orgController.createOrganisation);
router.put(
  "/:organisationId",
  restrictToOwnOrg,
  orgController.updateOrganisation,
);
router.delete(
  "/:organisationId",
  restrictToAdmin,
  orgController.deleteOrganisation,
);
router.patch(
  "/:organisationId/restore",
  restrictToAdmin,
  orgController.restoreOrganisation,
);

router.post(
  "/:organisationId/owners",
  restrictToOwnOrg,
  orgController.addOwner,
);
router.delete(
  "/:organisationId/owners/:ownerId",
  restrictToAdmin,
  orgController.removeOwner,
);

module.exports = router;
