import React from "react";
import "./MixedChartEnergyCompare.css";

import { Chart, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-moment";

const lsMonth = [
	"JAN",
	"FEB",
	"MAR",
	"APR",
	"MAY",
	"JUN",
	"JUL",
	"AUG",
	"SEP",
	"OCT",
	"NOV",
	"DEC",
];

let mixedChart;

class MixedChartEnergyCompare extends React.Component {
	constructor(props) {
		super(props);

		let labels = [];
		for (let monthIdx = new Date().getMonth(); labels.length < 12; monthIdx--) {
			if (monthIdx < 0) monthIdx += 12;
			labels.unshift(lsMonth[monthIdx % 12]);
		}

		this.state = {
			building: {},
			compareTo: "Target",
			energyData_month: {},
			compareData: [],
			lsBuilding: [],
			// Chart details
			data: {
				labels: labels,
			},
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
						title: {
							display: true,
							text: "kWh",
							font: {
								size: 16,
								weight: "600",
							},
						},
					},
				},
				plugins: {
					title: {
						display: true,
						text: "Energy Usage",
						align: "start",
						font: { weight: "bold", size: 20 },
					},
					tooltip: {
						enabled: true,
						padding: 14,
						backgroundColor: "#F2F2F2",
						titleColor: "#000",
						bodyColor: "#000",
						titleFont: { size: 20 },
						bodyFont: { size: 18 },
						bodySpacing: 10,
					},
					legend: {
						display: false,
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
							speed: 100,
						},
						limits: {
							x: { min: labels[0], max: labels[labels.length - 1] },
							y: { min: "original", max: "original" },
						},
					},
				},
			},
		};

		this.handleDoubleClick = this.handleDoubleClick.bind(this);
	}

	buildChart = () => {
		let { data, options, energyData_month, compareTo } = this.state;

		if (Object.keys(energyData_month).length === 0) return;

		let datasets = [
			{
				label: "Latest",
				backgroundColor: "#f3efa9",
				borderColor: "#f3efa9",
				data: [],
				type: "bar",
			},
			{
				label: compareTo,
				backgroundColor: "#E2E2E2",
				borderColor: "#E2E2E2",
				fill: "origin",
				borderWidth: 2,
				pointRadius: 2,
				data: [],
				type: "line",
			},
		];

		let yMax = 0;
		let month = new Date().getMonth();
		for (let i = 0; i < 12; i++) {
			if (month < 0) month += 12;

			let dataMonth = energyData_month[month];

			datasets[0].data.unshift(dataMonth.latest);

			let compareData = datasets[1].data;
			if (compareTo === "Target") compareData.unshift(dataMonth.target);
			else if (compareTo === "Average") compareData.unshift(dataMonth.average);

			for (let kwh of Object.values(energyData_month[month])) {
				if (kwh > yMax) yMax = kwh;
			}

			month--;
		}

		data.datasets = datasets;
		options.scales.yAxis.max = Math.ceil(yMax);

		document.getElementById("mc-energy-compare").remove();
		document.getElementById(
			"wrapper-mc-energy-compare"
		).innerHTML = `<canvas id="mc-energy-compare" />`;

		let ctx = document.getElementById("mc-energy-compare").getContext("2d");

		mixedChart = new Chart(ctx, {
			type: "bar",
			data: data,
			options: options,
		});

		this.setState({
			data: data,
		});
	};

	componentDidMount() {
		Chart.register(...registerables);
		Chart.register(zoomPlugin);
	}

	componentWillReceiveProps(nextProps) {
		let lsBuilding = nextProps.lsBuilding;
		let compareTo = nextProps.compareTo;
		let energyData_month = nextProps.energyData_month;

		this.setState(
			{
				lsBuilding: lsBuilding,
				energyData_month: energyData_month,
				compareTo: compareTo,
			},
			() => this.buildChart()
		);
	}

	handleDoubleClick() {
		if (mixedChart) mixedChart.resetZoom();
	}

	render() {
		return (
			<div
				id="wrapper-mc-energy-compare"
				onDoubleClick={this.handleDoubleClick}
			>
				<canvas id="mc-energy-compare" />
			</div>
		);
	}
}

export default MixedChartEnergyCompare;