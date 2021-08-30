import React from "react";
import "./SetTarget.css";
import {
	Row,
	Col,
	Container,
	Form,
	FormGroup,
	Label,
	Input,
	Button,
} from "reactstrap";
import { MdPeople } from "react-icons/md";
import { RiFileExcel2Fill } from "react-icons/ri";
import http from "../../../utils/http";
import BarAreaElectricityBillChart from "./BarAreaElectricityBillChart/BarAreaElectricityBillChart";
import PNBarBillCompareChart from "./PNBarBillCompareChart/PNBarBillCompareChart";
import EnergyCapitaLineChart from "./EnergyCapitaLineChart/EnergyCapitaLineChart";

class SetTarget extends React.Component {
	constructor(props) {
		super(props);

		let lsMonth = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];

		this.state = {
			lsMonth: lsMonth,
			lsBuilding: [],
			lastMonthTarget_bill: 0,
			lastMonthActual_bill: 0,
			lastYearTarget_bill: 0,
			lastYearActual_bill: 0,
			monthAverage_bill: 0,
			yearAverage_bill: 0,
			lastMonthTarget_usage: 0,
			lastMonthActual_usage: 0,
			lastYearTarget_usage: 0,
			lastYearActual_usage: 0,
			monthAverage_usage: 0,
			yearAverage_usage: 0,
			building: "Auditorium",
			month: new Date().getMonth(),
			year: new Date().getFullYear(),
			electricityBill: "",
			energyUsage: "",
			amountPeople: "",
			tariff: "",
			isDisplayTarget: true,
			isDisplayAverage: false,
		};

		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleRadioInputChange = this.handleRadioInputChange.bind(this);

		this.setTarget = this.setTarget.bind(this);

		this.getAllBuilding = this.getAllBuilding.bind(this);
		this.getTarget_MonthYear = this.getTarget_MonthYear.bind(this);
		this.getTargetPresets = this.getTargetPresets.bind(this);
	}

	componentDidMount() {
		this.getAllBuilding();
	}

	async getAllBuilding() {
		try {
			let resp = await http.get("/building/all");

			this.setState({ lsBuilding: resp.data }, () => this.getTargetPresets());
		} catch (err) {
			console.log(err);
			return err.response;
		}
	}

	handleInputChange(e) {
		this.setState({ [e.target.name]: e.target.value });
		if (
			e.target.name === "month" ||
			e.target.name === "year" ||
			e.target.name === "building"
		) {
			this.getTargetPresets();
		}
	}

	handleRadioInputChange(e) {
		if (e.target.name === "isDisplayTarget") {
			this.setState((prevState) => ({
				[e.target.name]: !prevState[e.target.name],
				isDisplayAverage: !prevState.isDisplayAverage,
			}));
		} else {
			this.setState((prevState) => ({
				[e.target.name]: !prevState[e.target.name],
				isDisplayTarget: !prevState.isDisplayTarget,
			}));
		}
	}

	async setTarget() {
		try {
			let {
				lsBuilding,
				building,
				month,
				year,
				electricityBill,
				energyUsage,
				amountPeople,
			} = this.state;

			let buildingID;
			for (let b of lsBuilding) {
				if (b.label === building) {
					buildingID = b.id;
					break;
				}
			}

			let payload = {
				building_id: buildingID,
				month: month,
				year: year,
			};

			if (electricityBill.length > 0) {
				payload.electricity_bill = electricityBill;
			}

			if (energyUsage.length > 0) {
				payload.energyUsage = energyUsage;
			}

			if (amountPeople.length > 0) {
				payload.amount_people = amountPeople;
			}

			let resp = await http.post("/target", payload);

			if (resp.status === 200) {
				alert("Target set successful.");
			}
		} catch (err) {
			console.log(err);
			return err.response;
		}
	}

	async getTarget_MonthYear() {
		try {
			let { month, year, building } = this.state;

			let payload = {
				month: month,
				year: year,
			};

			let resp = await http.post("/target/monthyear", payload);

			let lsTarget = resp.data;
			let target = lsTarget.find((target) => target.building === building);
			if (target) {
				this.setState({});
			}

			this.setState({
				lsTarget: lsTarget,
			});
		} catch (err) {
			console.log(err);
			return err.response;
		}
	}

	async getTargetPresets() {
		try {
			let { month, year, building, lsBuilding } = this.state;

			let payload = {
				month: month,
				year: year,
				building_id: lsBuilding.find((b) => b.label === building).id,
			};

			let resp = await http.post("/target/presets", payload);

			this.setState({
				lastMonthTarget_bill: resp.data.lastMonthTarget_bill,
				lastMonthActual_bill: resp.data.lastMonthActual_bill,
				lastYearTarget_bill: resp.data.lastYearTarget_bill,
				lastYearActual_bill: resp.data.lastYearActual_bill,
				monthAverage_bill: resp.data.monthAverage_bill,
				yearAverage_bill: resp.data.yearAverage_bill,

				lastMonthTarget_usage: resp.data.lastMonthTarget_usage,
				lastMonthActual_usage: resp.data.lastMonthActual_usage,
				lastYearTarget_usage: resp.data.lastYearTarget_usage,
				lastYearActual_usage: resp.data.lastYearActual_usage,
				monthAverage_usage: resp.data.monthAverage_usage,
				yearAverage_usage: resp.data.yearAverage_usage,
			});
		} catch (err) {
			console.log(err);
			return err.response;
		}
	}

	render() {
		let {
			lsMonth,
			lsBuilding,
			isDisplayTarget,
			isDisplayAverage,
			lastMonthTarget_bill,
			lastMonthActual_bill,
			lastYearTarget_bill,
			lastYearActual_bill,
			monthAverage_bill,
			yearAverage_bill,
			lastMonthTarget_usage,
			lastMonthActual_usage,
			lastYearTarget_usage,
			lastYearActual_usage,
			monthAverage_usage,
			yearAverage_usage,
		} = this.state;

		let currentYear = new Date().getFullYear();
		let end = currentYear + 20;
		let lsYear = [];
		for (let i = currentYear - 10; i < end; i++) {
			lsYear.push(i);
		}

		return (
			<div className="div-set-target">
				<Container className="container-set-target" fluid>
					<Row>
						<Col sm={4} className="heading">
							Set Target
						</Col>
						<Col sm={8}>
							<Row className="row-historical-data-title">
								<span className="title">Historical Data</span>
								<span className="excel-icon">
									<RiFileExcel2Fill size={30} />
								</span>
								<Button className="btn-period">Monthly</Button>
								<Button className="btn-period">Yearly</Button>
							</Row>
						</Col>
					</Row>
					<Container fluid>
						<Row>
							<Col sm={4}>
								{/* ******************************** CONFIG PANE ******************************** */}
								<Row className="row-config">
									<Form className="form-target">
										<FormGroup row className="fg-config-1">
											<Label for="month" sm={2}>
												Month
											</Label>
											<Col sm={4}>
												<Input
													type="select"
													name="month"
													id="monthSelect"
													value={new Date().getMonth()}
													onChange={this.handleInputChange}
												>
													{lsMonth.map((month, index) => (
														<option
															key={month}
															label={month}
															value={index}
														></option>
													))}
												</Input>
											</Col>
											<Label for="year" sm={2}>
												Year
											</Label>
											<Col sm={4}>
												<Input
													type="select"
													name="year"
													id="yearSelect"
													value={new Date().getFullYear()}
													onChange={this.handleInputChange}
												>
													{lsYear.map((year) => (
														<option>{year}</option>
													))}
												</Input>
											</Col>
										</FormGroup>
										<FormGroup row className="fg-config-building">
											<Label for="building" sm={2}>
												Building
											</Label>
											<Col sm={4}>
												<Input
													type="select"
													name="building"
													id="buildingSelect"
													onChange={this.handleInputChange}
												>
													{lsBuilding.map((building) => (
														<option key={building}>{building.label}</option>
													))}
												</Input>
											</Col>
											<Col sm={6} />
										</FormGroup>
										<FormGroup row className="fg-config-people">
											<Label
												for="amountPeople"
												sm={3}
												style={{
													color: "black",
													width: "fit-content",
												}}
											>
												People <MdPeople />
											</Label>
											<Col sm={6}>
												<Input
													type="number"
													name="amountPeople"
													id="amountPeople"
													min="0"
													placeholder="Enter Amount"
													autoComplete="off"
													onChange={this.handleInputChange}
												/>
											</Col>
											<Col sm={3} />
										</FormGroup>
										<FormGroup row className="fg-config-tariff">
											<Label
												for="tariff"
												sm={3}
												style={{
													color: "black",
													width: "fit-content",
												}}
											>
												Tariff (Baht/kWh)
											</Label>
											<Col sm={3}>
												<Input
													type="number"
													name="tariff"
													id="tariff"
													min="0"
													placeholder="4"
													autoComplete="off"
													onChange={this.handleInputChange}
												/>
											</Col>
											<Col sm={3} />
										</FormGroup>
										<FormGroup row className="fg-config-bill">
											<Label for="amountBill" sm={4}>
												Electricity Bill (THB)
											</Label>
											<Col sm={6}>
												<Input
													list="presets"
													type="number"
													name="electricityBill"
													id="electricityBill"
													min="0"
													placeholder="Enter Amount"
													autoComplete="off"
													onChange={this.handleInputChange}
												/>
												<datalist id="presets">
													<option
														label="Last Month Target"
														value={lastMonthTarget_bill}
													/>
													<option
														label="Last Month Actual"
														value={lastMonthActual_bill}
													/>
													<option
														label="Last Year Target"
														value={lastYearTarget_bill}
													/>
													<option
														label="Last Year Actual"
														value={lastYearActual_bill}
													/>
													<option
														label="Month Average"
														value={monthAverage_bill}
													/>
													<option
														label="Year Average"
														value={yearAverage_bill}
													/>{" "}
												</datalist>
											</Col>
											<Col sm={2} style={{ fontWeight: "600", margin: "auto" }}>
												Baht
											</Col>
										</FormGroup>
										<FormGroup row className="fg-config-usage">
											<Label for="energyUsage" sm={4}>
												Energy Usage
											</Label>
											<Col sm={6}>
												<Input
													list="presets"
													type="number"
													name="energyUsage"
													id="energyUsage"
													min="0"
													placeholder="Enter Amount"
													autoComplete="off"
													onChange={this.handleInputChange}
												/>
												<datalist id="presets">
													<option
														label="Last Month Target"
														value={lastMonthTarget_usage}
													/>
													<option
														label="Last Month Actual"
														value={lastMonthActual_usage}
													/>
													<option
														label="Last Year Target"
														value={lastYearTarget_usage}
													/>
													<option
														label="Last Year Actual"
														value={lastYearActual_usage}
													/>
													<option
														label="Month Average"
														value={monthAverage_usage}
													/>
													<option
														label="Year Average"
														value={yearAverage_usage}
													/>{" "}
												</datalist>
											</Col>
											<Col sm={2} style={{ fontWeight: "600", margin: "auto" }}>
												Baht
											</Col>
										</FormGroup>
										<FormGroup row>
											<Col sm={8} className="col-note">
												<span
													style={{
														textDecoration: "underline",
														alignSelf: "flex-end",
														width: "fit-content",
														paddingRight: 0,
													}}
												>
													*Note:
												</span>
												<span
													style={{
														alignSelf: "flex-end",
														marginLeft: "0.2rem",
														width: "fit-content",
														paddingLeft: 0,
													}}
												>
													Electricity bill is estimated
												</span>
											</Col>
											<Col sm={4} className="col-btn-set-target">
												<Button
													className="btn-set-target"
													onClick={this.setTarget}
												>
													Set
												</Button>
											</Col>
										</FormGroup>
									</Form>
								</Row>
							</Col>
							<Col sm={8}>
								{/* ****************************** HISTORICAL DATA PANE *****************************/}
								<Container fluid className="container-historical-data">
									{/* ****************************** CHART 1 **************************** */}
									<Row className="container-bill-chart">
										<Row className="row-chart-title">
											Electricity Bill (THB)
										</Row>
										<Row className="row-bill-chart">
											<Col sm={11} className="col-bill-chart">
												<BarAreaElectricityBillChart />
											</Col>
											<Col sm={1} className="col-form">
												<Row className="row-legend">
													<span className="dot-actual"></span>
													<span className="label-actual">Actual</span>
												</Row>
												<Row>
													<Form className="form-historical-data-charts">
														<FormGroup row>
															<Label check>
																<Input
																	type="radio"
																	name="isDisplayTarget"
																	onChange={this.handleRadioInputChange}
																	checked={isDisplayTarget}
																/>
																Target
															</Label>
															<Label check>
																<Input
																	type="radio"
																	name="isDisplayAverage"
																	onChange={this.handleRadioInputChange}
																	checked={isDisplayAverage}
																/>
																Average
															</Label>
														</FormGroup>
													</Form>
												</Row>
											</Col>
										</Row>
									</Row>
									{/* ****************************** CHART 2 **************************** */}
									<Row className="container-compare-chart">
										<Row className="row-chart-title">
											Electricity Bill Compared to{" "}
											{isDisplayTarget ? "Target" : "Average"}
										</Row>
										<Row className="row-compare-chart">
											<Col sm={11} className="col-compare-chart">
												<PNBarBillCompareChart />
											</Col>
											<Col sm={1} className="col-legend">
												<Row>
													<span className="block-saved">Saved</span>
												</Row>
												<Row>
													<span className="block-excess">Excess</span>
												</Row>
											</Col>
										</Row>
									</Row>
									{/* ****************************** CHART 2 **************************** */}
									<Row className="container-capita-chart">
										<Row className="row-chart-title">
											Electricity Bill Compared to{" "}
											{isDisplayTarget ? "Target" : "Average"}
										</Row>
										<Row className="row-capita-chart">
											<Col sm={11} className="col-capita-chart">
												<EnergyCapitaLineChart />
											</Col>
											<Col sm={1}></Col>
										</Row>
									</Row>
								</Container>
							</Col>
						</Row>
					</Container>
				</Container>
			</div>
		);
	}
}

export default SetTarget;
