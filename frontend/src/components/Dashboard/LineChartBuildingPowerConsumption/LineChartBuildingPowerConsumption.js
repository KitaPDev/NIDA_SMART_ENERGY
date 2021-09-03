import React from "react";
import "./LineChartBuildingPowerConsumption.css";

import { Chart, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-moment";

let lineChart;

class LineChartBuildingPowerConsumption extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			lsBuilding: this.props.lsBuilding,
			lsSelectedBuildingPrev: [],
			componentShouldUpdate: true,

			// Chart details
			data: {},
			options: {
				responsive: true,
				animation: false,
				maintainAspectRatio: false,
				interaction: {
					intersect: false,
					axis: "x",
					mode: "index",
				},
				scales: {
					xAxis: {
						type: "time",
						time: {
							displayFormats: {
								millisecond: "HH:mm:ss.SSS",
								second: "HH:mm:ss",
								minute: "HH:mm",
								hour: "HH:mm",
							},
						},
						grid: {
							display: false,
						},
					},
					yAxis: {
						min: 0,
						max: 100,
						display: true,
						grid: {
							display: false,
						},
					},
				},
				plugins: {
					title: {
						display: true,
						text: "Power (kW)",
						align: "start",
						font: { weight: "bold", size: 20 },
						padding: {
							bottom: 10,
						},
					},
					legend: {
						display: false,
					},
					tooltip: {
						enabled: true,
						padding: 14,
						backgroundColor: "#F2F2F2f0",
						titleColor: "#000",
						bodyColor: "#000",
						titleFont: { size: 18 },
						bodyFont: { size: 16 },
					},
					zoom: {
						pan: {
							enabled: true,
							mode: "xy",
						},
						zoom: {
							wheel: { enabled: true },
							pinch: { enabled: true },
							mode: "xy",
							speed: 2,
						},
						limits: {
							x: { min: this.props.dateFrom, max: this.props.dateTo },
							y: { min: "original", max: "original" },
						},
					},
				},
			},
		};

		this.handleDoubleClick = this.handleDoubleClick.bind(this);
	}

	buildChart = () => {
		let { data, options } = this.state;

		document.getElementById("lc-building-power").remove();
		document.getElementById(
			"wrapper-lc-building-power"
		).innerHTML = `<canvas id="lc-building-power" />`;

		let ctx = document.getElementById("lc-building-power").getContext("2d");

		lineChart = new Chart(ctx, {
			type: "line",
			data: data,
			options: options,
		});
	};

	componentDidMount() {
		Chart.register(...registerables);
		Chart.register(zoomPlugin);
	}

	componentWillReceiveProps(nextProps) {
		let { data, options, lsSelectedBuildingPrev } = this.state;

		if (
			JSON.stringify(this.props.lsKw_system_building) ===
				JSON.stringify(nextProps.lsKw_system_building) &&
			JSON.stringify(lsSelectedBuildingPrev) ===
				JSON.stringify(nextProps.lsSelectedBuilding) &&
			Object.values(data).length > 0
		) {
			return;
		}

		let lsKw_system_building = {};
		Object.assign(lsKw_system_building, nextProps.lsKw_system_building);

		let lsSelectedBuilding = nextProps.lsSelectedBuilding.slice();
		let lsBuilding = nextProps.lsBuilding;

		if (Object.keys(lsKw_system_building).length <= 1) return;

		let labels = [];
		let datasets = [];

		let yMax = 1;

		for (let [building, lsKw_system] of Object.entries(lsKw_system_building)) {
			let color = lsBuilding.find((b) => b.label === building).color_code;

			let dataset = {
				label: building,
				fill: false,
				borderColor: color,
				backgroundColor: color,
				borderWidth: 2,
				spanGaps: true,
				pointRadius: 2,
			};

			let data = [];
			let prevDatetime;

			for (let logKwMain of lsKw_system["Main"]) {
				let datetime = new Date(logKwMain.datetime);
				let kw = logKwMain.kw;

				if (datasets.length === 0) {
					if (!labels.find((d) => d.getTime() === datetime.getTime())) {
						labels.push(new Date(datetime));
					}
				}

				if (!lsSelectedBuilding.includes(building)) {
					prevDatetime = datetime;
					continue;
				}

				if (prevDatetime) {
					if (datetime.getTime() === prevDatetime.getTime()) {
						data[data.length - 1] += kw;

						if (data[data.length - 1] > yMax) yMax = data[data.length - 1];
					} else data.push(kw);
				} else data.push(kw);

				if (kw > yMax) yMax = kw;

				prevDatetime = datetime;
			}

			dataset.data = data;

			if (!lsSelectedBuilding.includes(building)) dataset = {};

			datasets.push(dataset);
		}

		data.labels = labels;
		data.datasets = datasets;

		options.scales.xAxis.min = labels[0];
		options.scales.xAxis.max = labels[labels.length - 1];
		options.scales.yAxis.max = yMax + 10;

		options.plugins.zoom.limits.x.min = labels[0];
		options.plugins.zoom.limits.x.max = labels[labels.length - 1];

		this.setState({
			data: data,
			options: options,
			componentShouldUpdate: true,
			lsSelectedBuildingPrev: lsSelectedBuilding,
		});

		this.buildChart();
	}

	shouldComponentUpdate() {
		return this.state.componentShouldUpdate;
	}

	componentDidUpdate() {
		this.setState({ componentShouldUpdate: false });
	}

	handleDoubleClick() {
		if (lineChart) lineChart.resetZoom();
	}

	render() {
		return (
			<div
				id="wrapper-lc-building-power"
				onDoubleClick={this.handleDoubleClick}
			>
				<canvas id="lc-building-power" />
			</div>
		);
	}
}

export default LineChartBuildingPowerConsumption;