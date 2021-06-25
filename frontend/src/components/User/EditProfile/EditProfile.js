import React from "react";
import { ImagePicker } from "react-file-picker";
import {
	Row,
	Col,
	Container,
	Table,
	Button,
	Input,
	Modal,
	ModalHeader,
	ModalBody,
	ModalFooter,
} from "reactstrap";
import "./EditProfile.css";
import { FaCamera, FaUserCircle } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";
import http from "../../../httpService";

class EditProfile extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			prevUsername: "",
			prevEmail: "",
			username: "",
			email: "",
			userType: "",
			dateActivated: "",
			dateLastLogin: "",
			prevProfileImage: "",
			profileImage: "",
			isUserTypeApproved: 0,
			isDeactivated: 0,
			isEditUsernameMode: false,
			isEditEmailMode: false,
			isModalConfirmUsernameOpen: false,
			isModalConfirmEmailOpen: false,
		};

		this.getUserInfo = this.getUserInfo.bind(this);
		this.formatDate = this.formatDate.bind(this);
		this.toggleEditUsername = this.toggleEditUsername.bind(this);
		this.toggleEditEmail = this.toggleEditEmail.bind(this);
		this.handleInputChange = this.handleInputChange.bind(this);
		this.submitUsername = this.submitUsername.bind(this);
		this.submitEmail = this.submitEmail.bind(this);
		this.toggleModalConfirmUsername =
			this.toggleModalConfirmUsername.bind(this);
		this.toggleModalConfirmEmail = this.toggleModalConfirmEmail.bind(this);
		this.logout = this.logout.bind(this);
		this.uploadImage = this.uploadImage.bind(this);
	}

	componentDidMount() {
		this.getUserInfo();
	}

	async getUserInfo() {
		let propsUsername = this.props.username;

		let resp;
		if (!propsUsername) {
			resp = await http.get("/user/info");
		} else {
			let payload = {
				username: propsUsername,
			};
			resp = await http.post("/user/info", payload);
		}

		let userInfo = resp.data;

		let prevUsername = userInfo.username;
		let username = userInfo.username;
		let prevEmail = userInfo.email;
		let email = userInfo.email;
		let userType = userInfo.user_type;
		let dateActivated = new Date(userInfo.activated_timestamp);
		let dateLastLogin = new Date(userInfo.last_login_timestamp);
		let prevProfileImage =
			userInfo.profile_image === undefined || userInfo.profile_image === null
				? ""
				: userInfo.profile_image;
		let isUserTypeApproved = userInfo.is_user_type_approved;
		let isDeactivated = userInfo.is_deactivated;

		this.setState({
			prevUsername: prevUsername,
			prevEmail: prevEmail,
			username: username,
			email: email,
			userType: userType,
			dateActivated: dateActivated,
			dateLastLogin: dateLastLogin,
			prevProfileImage: prevProfileImage,
			profileImage: prevProfileImage,
			isUserTypeApproved: isUserTypeApproved,
			isDeactivated: isDeactivated,
		});
	}

	handleInputChange(e) {
		this.setState({ [e.target.name]: e.target.value });
	}

	formatDate(date) {
		if (date instanceof Date) {
			const offset = date.getTimezoneOffset();
			date = new Date(date.getTime() - offset * 60 * 1000);
			return date.toISOString().split("T")[0];
		}
	}

	toggleEditUsername() {
		let prevUsername = this.state.prevUsername;
		let username = this.state.username;

		if (prevUsername !== username) {
			this.setState({ username: prevUsername });
		}

		this.setState((prevState) => ({
			isEditUsernameMode: !prevState.isEditUsernameMode,
		}));
	}

	toggleEditEmail() {
		let prevEmail = this.state.prevEmail;
		let email = this.state.email;

		if (prevEmail !== email) {
			this.setState({ email: prevEmail });
		}
		this.setState((prevState) => ({
			isEditEmailMode: !prevState.isEditEmailMode,
		}));
	}

	async submitUsername() {
		try {
			let username = this.state.username;

			let payload = {
				username: username,
			};

			await http.post("/user/username", payload);

			this.setState({ prevUsername: username });

			this.toggleModalConfirmUsername();
			this.toggleEditUsername();
		} catch (err) {
			console.log(err);
			alert("Unable to change your username. Please try again.");
			return err.response;
		}
	}

	async submitEmail() {
		try {
			let email = this.state.email;

			let payload = {
				email: email,
			};

			await http.post("/user/email", payload);

			this.setState({ prevEmail: email });

			this.toggleModalConfirmEmail();
			this.toggleEditEmail();

			this.logout();
		} catch (err) {
			console.log(err);
			alert("Unable to change your email address. Please try again.");
			return err.response;
		}
	}

	toggleModalConfirmUsername() {
		this.setState((prevState) => ({
			isModalConfirmUsernameOpen: !prevState.isModalConfirmUsernameOpen,
		}));
	}

	toggleModalConfirmEmail() {
		this.setState((prevState) => ({
			isModalConfirmEmailOpen: !prevState.isModalConfirmEmailOpen,
		}));
	}

	logout() {
		http.get("/auth/logout");
		this.props.history.push({
			pathname: "/login",
		});
		this.setState({ username: "" });
	}

	async uploadImage() {
		try {
			let image = this.state.profileImage;

			let payload = {
				image: image,
			};

			await http.post("/user/profile-image", payload);
			alert("Profile image changed.");

			this.setState({ prevProfileImage: image });
		} catch (err) {
			console.log(err);
			alert("Unable to upload your profile image. Please try again.");
			return err.response;
		}
	}

	render() {
		let currentUsername = localStorage.getItem("current_username");

		let {
			prevProfileImage,
			profileImage,
			username,
			email,
			userType,
			dateActivated,
			dateLastLogin,
			isUserTypeApproved,
			isDeactivated,
			isEditUsernameMode,
			isEditEmailMode,
			isModalConfirmUsernameOpen,
			isModalConfirmEmailOpen,
		} = this.state;

		return (
			<div className="div-edit-profile">
				<Container className="container-user-info" fluid>
					<Row className="heading">User Information</Row>

					<Row className="row-content">
						<Col sm={2} className="col-image">
							<Row className="row-user-image">
								{profileImage.length === 0 ? (
									<FaUserCircle size={200} style={{ opacity: 0.9 }} />
								) : (
									<img
										className="user-image"
										src={profileImage}
										alt="Profile"
									/>
								)}
							</Row>
							<Row className="row-imagepicker">
								<ImagePicker
									extensions={["jpg", "png", "jpeg", "JPG", "PNG", "JPEG"]}
									dims={{
										minWidth: 100,
										maxWidth: 500,
										minHeight: 100,
										maxHeight: 500,
									}}
									onChange={(base64) => this.setState({ profileImage: base64 })}
									onError={(err) => {
										alert(err);
									}}
								>
									<span className="choose-image">
										<FaCamera />
										Choose an Image
									</span>
								</ImagePicker>
							</Row>
							{prevProfileImage !== profileImage ? (
								<Row className="row-upload">
									<Button className="btn-upload" onClick={this.uploadImage}>
										Upload
									</Button>
								</Row>
							) : (
								""
							)}
						</Col>
						<Col sm={isEditUsernameMode || isEditEmailMode ? 5 : 4}>
							<Table className="table-user-info">
								<tbody>
									<tr>
										<th style={{ verticalAlign: "middle" }} scope="row">
											Username
										</th>
										{isEditUsernameMode ? (
											<td>
												<Input
													type="text"
													name="username"
													id="username"
													onChange={this.handleInputChange}
													value={username}
												/>
											</td>
										) : (
											<td>{username}</td>
										)}
										{isEditUsernameMode ? (
											<td style={{ textAlign: "right" }}>
												<Button
													color="primary"
													className="btn-submit"
													onClick={this.toggleModalConfirmUsername}
												>
													Submit
												</Button>
											</td>
										) : (
											<td className="td-edit">
												<MdModeEdit onClick={this.toggleEditUsername} />
											</td>
										)}
										{isEditUsernameMode ? (
											<td>
												<Button
													color="danger"
													className="btn-submit"
													onClick={this.toggleEditUsername}
												>
													Cancel
												</Button>
											</td>
										) : (
											""
										)}
									</tr>
									<tr>
										<th style={{ verticalAlign: "middle" }} scope="row">
											Email
										</th>
										{isEditEmailMode ? (
											<td>
												<Input
													type="text"
													name="email"
													id="email"
													onChange={this.handleInputChange}
													value={email}
												/>
											</td>
										) : (
											<td>{email}</td>
										)}
										{isEditEmailMode ? (
											<td style={{ textAlign: "right" }}>
												<Button
													color="primary"
													className="btn-submit"
													onClick={this.toggleModalConfirmEmail}
												>
													Submit
												</Button>
											</td>
										) : (
											<td className="td-edit">
												<MdModeEdit onClick={this.toggleEditEmail} />
											</td>
										)}
										{isEditEmailMode ? (
											<td>
												<Button
													color="danger"
													className="btn-submit"
													onClick={this.toggleEditEmail}
												>
													Cancel
												</Button>
											</td>
										) : (
											""
										)}
									</tr>
									<tr>
										<th scope="row">User Type</th>
										<td>
											{userType}
											{isUserTypeApproved ? "" : " (Pending)"}
										</td>
									</tr>
									<tr>
										<th scope="row">Activated Date</th>
										<td>{this.formatDate(dateActivated)}</td>
									</tr>
									<tr>
										<th scope="row">Last Login</th>
										<td>{this.formatDate(dateLastLogin)}</td>
									</tr>
									<tr>
										<th scope="row">Status</th>
										<td>
											{isDeactivated ? (
												<div>
													<span className="red-dot"></span> Inactive
												</div>
											) : (
												<div>
													<span className="green-dot"></span> Active
												</div>
											)}
										</td>
									</tr>
									<tr>
										<td className="td-button">
											<Button className="btn-change-password">
												Change Password
											</Button>
										</td>
										{currentUsername === username ||
										userType === "Super Admin" ||
										userType === "Admin" ? (
											<td className="td-button">
												<Button className="btn-deactivate">Deactivate</Button>
											</td>
										) : (
											<td></td>
										)}
									</tr>
								</tbody>
							</Table>
						</Col>
					</Row>
				</Container>
				<Modal
					isOpen={isModalConfirmUsernameOpen}
					toggle={this.toggleModalConfirmUsername}
				>
					<ModalHeader toggle={this.toggleModalConfirmUsername}>
						Confirm Edit Username
					</ModalHeader>
					<ModalFooter>
						<Button color="primary" onClick={this.submitUsername}>
							Confirm
						</Button>{" "}
						<Button color="secondary" onClick={this.toggleModalConfirmUsername}>
							Cancel
						</Button>
					</ModalFooter>
				</Modal>
				<Modal
					isOpen={isModalConfirmEmailOpen}
					toggle={this.toggleModalConfirmEmail}
				>
					<ModalHeader toggle={this.toggleModalConfirmEmail}>
						Confirm Edit Email
					</ModalHeader>
					<ModalBody>
						You will be logged out after changing your email address.
					</ModalBody>
					<ModalFooter>
						<Button color="primary" onClick={this.submitEmail}>
							Confirm
						</Button>{" "}
						<Button color="secondary" onClick={this.toggleModalConfirmEmail}>
							Cancel
						</Button>
					</ModalFooter>
				</Modal>
			</div>
		);
	}
}

export default EditProfile;
