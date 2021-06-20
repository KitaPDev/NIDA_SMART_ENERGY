import React from "react";
import "./Login.css";
import {
	Row,
	Col,
	Container,
	Button,
	Form,
	FormGroup,
	Label,
	Input,
} from "reactstrap";
import { Link } from "react-router-dom";
import axios from "axios";

class Login extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showPassword: false,
			username: "",
			password: "",
			isCredentialsIncorrect: false,
			isUsernameEmpty: false,
			isPasswordEmpty: false,
		};

		this.toggleShowPassword = this.toggleShowPassword.bind(this);
		this.handleInputChange = this.handleInputChange.bind(this);
		this.submitLogin = this.submitLogin.bind(this);
	}

	toggleShowPassword() {
		this.setState({ showPassword: !this.state.showPassword });
	}

	handleInputChange(e) {
		this.setState({ [e.target.name]: e.target.value });
	}

	async submitLogin() {
		let { username, password } = this.state;

		this.setState({ isCredentialsIncorrect: false });

		if (username.length === 0) {
			this.setState({ isUsernameEmpty: true });
			return;
		} else {
			this.setState({ isUsernameEmpty: false });
		}

		if (password.length === 0) {
			this.setState({ isPasswordEmpty: true });
			return;
		} else {
			this.setState({ isPasswordEmpty: false });
		}

		let resp = await this.postLogin(username, password);

		if (resp.status === 200) {
			this.props.history.push({
				pathname: "/",
			});
		} else if (resp.status === 500) {
			alert("Could not perform login. Please try again");
		} else {
			this.setState({ isCredentialsIncorrect: true });
		}
	}

	async postLogin(username, password) {
		try {
			let payload = {
				username: username,
				password: password,
			};

			return await axios.post(
				process.env.REACT_APP_API_BASE_URL + "/auth/login",
				payload
			);
		} catch (err) {
			console.log(err);
		}
	}

	render() {
		let {
			showPassword,
			username,
			password,
			isCredentialsIncorrect,
			isUsernameEmpty,
			isPasswordEmpty,
		} = this.state;

		return (
			<div style={{ backgroundColor: "#f2f3f7", height: "100vh" }}>
				<Container fluid className="container-login">
					<Row>
						<Col sm={2} className="col-brand">
							<img className="navbar-logo" src="favicon.ico" alt="logo"></img>
						</Col>
						<Col sm={10} className="col-title">
							NIDA SMART ENERGY
						</Col>
					</Row>

					<Container className="container-form">
						<Row className="row-heading">Login</Row>
						<Row>
							<Form>
								<FormGroup row>
									<Label for="username" sm={2}>
										Username
									</Label>
									<Col sm={6}>
										<Input
											type="text"
											name="username"
											id="username"
											onChange={this.handleInputChange}
											value={username}
										/>
									</Col>
								</FormGroup>
								<FormGroup row>
									<Label for="password" sm={2}>
										Password
									</Label>
									<Col sm={6}>
										<Input
											type={showPassword ? "text" : "password"}
											name="password"
											id="password"
											value={password}
											onChange={this.handleInputChange}
										/>
									</Col>
								</FormGroup>
								<FormGroup row>
									<Col sm={2}></Col>
									<Col sm={6} style={{ textAlign: "right" }}>
										<Label check>
											<Input
												type="checkbox"
												onClick={this.toggleShowPassword}
												checked={showPassword}
											/>{" "}
											Show password
										</Label>
									</Col>
								</FormGroup>
								<FormGroup row>
									<Button className="btn-login" onClick={this.submitLogin}>
										Log In
									</Button>
								</FormGroup>
							</Form>
						</Row>
						{isCredentialsIncorrect ? (
							<Row className="row-feedback">Credentials don't match!</Row>
						) : (
							""
						)}
						{isUsernameEmpty ? (
							<Row className="row-feedback">Please fill in your username.</Row>
						) : (
							""
						)}
						{isPasswordEmpty ? (
							<Row className="row-feedback">Please fill in your password.</Row>
						) : (
							""
						)}

						<Row className="row-forgot-password">
							<Link to="/forgot-password" className="link">
								Forgot password?
							</Link>
						</Row>
						<Row className="row-link">
							<Link to="/register" className="link">
								Register?
							</Link>
						</Row>
					</Container>
				</Container>

				<footer>
					Address : 148 Seri Thai Rd., Khlong Chan, Bang Kapi, Bangkok 10240 Tel
					: 0-2727-3000
				</footer>
			</div>
		);
	}
}

export default Login;
