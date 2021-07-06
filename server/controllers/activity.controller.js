const targetService = require("../services/target.service");
const activityService = require("../services/activity.service");
const httpStatusCodes = require("http-status-codes").StatusCodes;
const { response } = require("express");

async function getActivityPeriod(req, res) {
	try {
		let body = req.body;
		let from = body.from;
		let to = body.to;

		let result = await activityService.getActivityByPeriod(from, to);

		return res.status(httpStatusCodes.OK).send(result);
	} catch (err) {
		return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
	}
}

module.exports = { getActivityPeriod };