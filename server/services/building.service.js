const knex = require("../database").knex;
const dateFormatter = require("../utils/dateFormatter");

async function getAllBuilding() {
  let result = await knex(knex.ref("building")).select();
  return result;
}

async function getData(buildingID, dateFrom, dateTo) {
  let result = await knex("log_power_meter")
    .join("device", "log_power_meter.device_id", "=", "device.id")
    .join("building", "device.building_id", "=", "building.id")
    .join("system", "device.system_id", "=", "system.id")
    .select(
      "log_power_meter.data_datetime",
      "building.label as building",
      "device.floor",
      "device.id as device",
      "system.label as system",
      "log_power_meter.kw_total as kw",
      "log_power_meter.kwh"
    )
    .where(
      "log_power_meter.data_datetime",
      ">=",
      dateFormatter.yyyymmddhhmmss(new Date(dateFrom))
    )
    .andWhere(
      "log_power_meter.data_datetime",
      "<=",
      dateFormatter.yyyymmddhhmmss(new Date(dateTo))
    )
    .andWhere("building.id", "=", buildingID)
    .andWhere(knex.raw(`MINUTE(data_datetime) % 15 = 0`))
    .orderBy("log_power_meter.data_datetime", "asc");

  return result;
}

async function getBillCompareData(buildingID) {
  let today = new Date();

  let data = {};

  data.lsTarget = [];
  data.lsLog_year_month = {};

  let month = today.getMonth();
  let year = today.getFullYear();
  for (let i = 0; i < 12; i++) {
    if (month < 0) {
      month += 12;
      year--;
    }

    data.lsLog_year_month[month] = {};

    let firstDay = new Date(year, month, 1, 0, 0);
    let lastDay = new Date(year, month + 1, 0, 0);

    // For current month when now is not last day of month.
    if (i === 0) lastDay = new Date();

    let dateStart_before = firstDay;
    let dateStart_after = new Date(firstDay.getTime() + 43200000); // 12 Hours after beginning of first day.
    let dateEnd_before = new Date(lastDay.getTime() - 43200000); // 12 Hours before beginning of last day.
    let dateEnd_after = lastDay;

    for (let j = 0; j <= 3; j++) {
      let ds_before = new Date(dateStart_before);
      ds_before.setFullYear(dateStart_before.getFullYear() - j);
      let ds_after = new Date(dateStart_after);
      ds_after.setFullYear(dateStart_after.getFullYear() - j);

      let de_before = new Date(dateEnd_before);
      de_before.setFullYear(dateEnd_before.getFullYear() - j);
      let de_after = new Date(dateEnd_after);
      de_after.setFullYear(dateEnd_after.getFullYear() - j);

      let result = await knex("log_power_meter")
        .join("device", "log_power_meter.device_id", "=", "device.id")
        .join("building", "device.building_id", "=", "building.id")
        .join("system", "device.system_id", "=", "system.id")
        .select(
          "log_power_meter.data_datetime",
          "building.label as building",
          "device.id as device",
          "log_power_meter.kwh",
          "system.label as system"
        )
        .where(function () {
          if (Array.isArray(buildingID)) {
            this.whereIn("building.id", buildingID);
          } else {
            this.where("building.id", "=", buildingID);
          }
        })
        .andWhere(function () {
          this.whereBetween("log_power_meter.data_datetime", [
            dateFormatter.yyyymmddhhmmss(ds_before),
            dateFormatter.yyyymmddhhmmss(ds_after),
          ]).orWhereBetween("log_power_meter.data_datetime", [
            dateFormatter.yyyymmddhhmmss(de_before),
            dateFormatter.yyyymmddhhmmss(de_after),
          ]);
        });

      data.lsLog_year_month[month][year - j] = result;

      // Target
      result = await knex("target")
        .join("building", "target.building_id", "=", "building.id")
        .select(
          "target.amount_people",
          "target.electricity_bill",
          "target.energy_usage",
          "target.month",
          "target.year",
          "target.tariff",
          "building.label as building"
        )
        .where({
          month: month,
          year: year - j,
        })
        .andWhere(function () {
          if (Array.isArray(buildingID)) {
            this.whereIn("building_id", buildingID);
          } else {
            this.where("building_id", "=", buildingID);
          }
        });

      data.lsTarget = data.lsTarget.concat(result);
    }

    month--;
  }

  return data;
}

async function getEnergyUsageDatetime(lsBuildingID, start, end) {
  let result = await knex("log_power_meter")
    .join("device", "log_power_meter.device_id", "=", "device.id")
    .join("building", "device.building_id", "=", "building.id")
    .join("system", "device.system_id", "=", "system.id")
    .select(
      "log_power_meter.data_datetime",
      "building.label as building",
      "device.id as device",
      "log_power_meter.kwh",
      "system.label as system"
    )
    .where(function () {
      this.whereIn("building.id", lsBuildingID);
    })
    .andWhere(function () {
      let dateStart_before = start;
      let dateStart_after = new Date(dateStart_before.getTime() + 43200000);
      let dateEnd_after = end;
      let dateEnd_before = new Date(dateEnd_after.getTime() - 43200000);

      this.whereBetween("log_power_meter.data_datetime", [
        dateFormatter.yyyymmddhhmmss(dateStart_before),
        dateFormatter.yyyymmddhhmmss(dateStart_after),
      ]).orWhereBetween("log_power_meter.data_datetime", [
        dateFormatter.yyyymmddhhmmss(dateEnd_before),
        dateFormatter.yyyymmddhhmmss(dateEnd_after),
      ]);
    })
    .orderBy("log_power_meter.data_datetime", "desc");

  return result;
}

async function getDataBuildingMonthYear(lsBuildingID, start, end) {
  let monthDiff = (start.getFullYear() - end.getFullYear()) * 12;
  monthDiff -= start.getMonth();
  monthDiff += end.getMonth();
  if (monthDiff < 0) monthDiff = 0;

  let lsLog = [];

  let year = start.getFullYear();
  let month = start.getMonth();
  for (i = 0; i <= monthDiff; i++) {
    if (month > 11) {
      year++;
      month = 0;
    }

    let result = await knex("log_power_meter")
      .join("device", "log_power_meter.device_id", "=", "device.id")
      .join("building", "device.building_id", "=", "building.id")
      .join("system", "device.system_id", "=", "system.id")
      .select(
        "log_power_meter.data_datetime",
        "building.label as building",
        "device.id as device",
        "log_power_meter.kwh",
        "system.label as system"
      )
      .where(function () {
        this.whereIn("building.id", lsBuildingID);
      })
      .andWhere("system.label", "=", "Main")
      .andWhere(function () {
        let dateStart_before = new Date(year, month, 1, 0, 0, 0);
        let dateStart_after = new Date(dateStart_before.getTime() + 43200000);
        let dateEnd_after = new Date(year, month + 1, 0, 0, 0, 0);

        let dateEnd_before = new Date(dateEnd_after.getTime() - 43200000);

        this.whereBetween("log_power_meter.data_datetime", [
          dateFormatter.yyyymmddhhmmss(dateStart_before),
          dateFormatter.yyyymmddhhmmss(dateStart_after),
        ]).orWhereBetween("log_power_meter.data_datetime", [
          dateFormatter.yyyymmddhhmmss(dateEnd_before),
          dateFormatter.yyyymmddhhmmss(dateEnd_after),
        ]);
      })
      .orderBy("log_power_meter.data_datetime", "desc");

    lsLog.push(...result);

    month++;
  }

  return lsLog;
}

async function getPowerIaqDatetime(lsBuildingID, start, end) {
  let result = await knex("log_power_meter")
    .join("device", "log_power_meter.device_id", "=", "device.id")
    .join("building", "device.building_id", "=", "building.id")
    .join("system", "device.system_id", "=", "system.id")
    .join(
      "log_iaq",
      "log_iaq.data_datetime",
      "=",
      "log_power_meter.data_datetime"
    )
    .select(
      "log_power_meter.data_datetime",
      "building.label as building",
      "device.id as device",
      "log_power_meter.kw_total as kw",
      "log_iaq.humidity",
      "log_iaq.temperature"
    )
    .where(function () {
      this.whereIn("building.id", lsBuildingID);
    })
    .andWhereBetween("log_power_meter.data_datetime", [
      dateFormatter.yyyymmddhhmmss(start),
      dateFormatter.yyyymmddhhmmss(end),
    ])
    .andWhere(knex.raw(`MINUTE(log_power_meter.data_datetime) % 15 = 0`))
    .andWhere("system.label", "=", "Air Conditioner")
    .orderBy("log_power_meter.data_datetime", "desc");

  return result;
}

module.exports = {
  getAllBuilding,
  getData,
  getBillCompareData,
  getEnergyUsageDatetime,
  getDataBuildingMonthYear,
  getPowerIaqDatetime,
};
