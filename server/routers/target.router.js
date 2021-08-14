const express = require("express");
const targetController = require("../controllers/target.controller");
const authenticateJWT = require("../middleware/authenticateJWT");

let router = express.Router();

router.post("/people", authenticateJWT, async function (req, res) {
	targetController.getBuildingPeople(req, res);
});

router.post("/", authenticateJWT, async function (req, res) {
	targetController.inputTarget(req, res);
});

router.post("/monthyear", authenticateJWT, async function (req, res) {
	targetController.getAllTargetByMonthYear(req, res);
});

router.post("/monthyear/tariff", authenticateJWT, async function (req, res) {
	targetController.getAllBuildingTariffByMonthYear(req, res);
});

module.exports = router;
