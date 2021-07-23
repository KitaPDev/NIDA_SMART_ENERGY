const knex = require("../database").knex;
const dateFormatter = require("../utils/dateFormatter");

async function getAllBuilding() {
	let result = await knex(knex.ref("building")).select();
	return result;
}

async function getBuildingPowerByDatetime(start, end) {
	let result = await knex("log_power_meter")
		.join("device", "log_power_meter.device_id", "=", "device.id")
		.join("building", "device.building_id", "=", "building.id")
		.join(
			"electrical_system",
			"device.electrical_system_id",
			"=",
			"electrical_system.id"
		)
		.select(
			"log_power_meter.data_datetime",
			"building.label as building",
			"device.floor",
			"device.id as device",
			"electrical_system.label as system",
			"log_power_meter.kw_total as kw",
			"log_power_meter.kwh"
		)
		.where(
			"log_power_meter.data_datetime",
			">=",
			dateFormatter.yyyymmddhhmmss(new Date(start))
		)
		.andWhere(
			"log_power_meter.data_datetime",
			"<=",
			dateFormatter.yyyymmddhhmmss(new Date(end))
		)
		.orderBy("log_power_meter.data_datetime", "asc");

	return result;
}

module.exports = {
	getAllBuilding,
	getBuildingPowerByDatetime,
};
