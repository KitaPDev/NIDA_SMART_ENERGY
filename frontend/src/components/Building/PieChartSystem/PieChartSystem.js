import React, { PureComponent } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "./PieChartSystem.css";
import numberFormatter from "../../../utils/numberFormatter";

const COLORS = ["#3c67be", "#FDD865"];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontWeight="600"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const getLine1 = () => {
  return (
    "TODAY 00:00 - " +
    new Date().toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );
};

const getLine2 = (building, ac, others) => {
  let totalEnergyConsumption = ac + others;

  return (
    building +
    " " +
    numberFormatter.withCommas(Math.round(totalEnergyConsumption)) +
    " kWh"
  );
};

const getLine3 = (ac, others) => {
  let percentAC = Math.round((ac / (ac + others)) * 100);

  return (
    "Air Conditioner " +
    percentAC +
    "% " +
    numberFormatter.withCommas(Math.round(ac)) +
    " kWh"
  );
};

const getLine4 = (ac, others) => {
  let percentOthers = Math.round((others / (ac + others)) * 100);

  return (
    "Others " +
    percentOthers +
    "% " +
    numberFormatter.withCommas(Math.round(others)) +
    " kWh"
  );
};

const CustomTooltip = ({ active, label, ...props }) => {
  if (active) {
    let building = props.building;
    let ac = props.ac;
    let others = props.others;

    return (
      <div
        style={{
          backgroundColor: "#F0F0F0",
          borderRadius: "1rem",
          padding: "1rem",
          width: "250px",
        }}
      >
        <p style={{ marginBottom: 0, fontWeight: "bold" }}>{getLine1()}</p>
        <p style={{ marginBottom: 0, fontWeight: "bold" }}>
          {getLine2(building, ac, others)}
        </p>
        <p
          style={{
            marginBottom: 0,
            color: "#3c67be",
            fontSize: "90%",
            fontWeight: "600",
          }}
        >
          {getLine3(ac, others)}
        </p>
        <p
          style={{
            marginBottom: 0,
            color: "#be4114",
            fontSize: "90%",
            fontWeight: "600",
          }}
        >
          {getLine4(ac, others)}
        </p>
      </div>
    );
  }

  return null;
};

class PieChartSystem extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      ac: 0,
      others: 0,
    };
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.ac === prevProps.ac &&
      this.props.others === prevProps.others
    )
      return;

    this.setState({
      ac: this.props.ac,
      others: this.props.others,
      disabled: this.props.disabled,
    });
  }

  render() {
    let { ac, others, disabled } = this.state;

    let data = [
      { name: "Air Conditioner", value: ac },
      { name: "Others", value: others },
    ];

    if (disabled) {
      data = [{ name: "", value: 100 }];
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart width={500} height={500}>
          <Pie
            isAnimationActive={true}
            dataKey="value"
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={60}
            fill="#8884d8"
            label={disabled ? "" : renderCustomizedLabel}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={disabled ? "#D2D9DC" : COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          {disabled ? (
            ""
          ) : (
            <Tooltip
              position={{ x: 210, y: 50 }}
              content={
                <CustomTooltip
                  building={this.props.building}
                  ac={this.props.ac}
                  others={this.props.others}
                />
              }
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    );
  }
}

export default PieChartSystem;
