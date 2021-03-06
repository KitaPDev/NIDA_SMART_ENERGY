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
import qs from "qs";

import http from "../../utils/http";

import { withTranslation } from "react-i18next";

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
      errorMessage: "",
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

    let redirect = qs.parse(this.props.location.search, {
      ignoreQueryPrefix: true,
    }).redirect;

    let resp = await this.postLogin(username, password, redirect);

    if (resp) {
      if (resp.status === 200) {
        if (redirect) {
          window.location.assign("http://" + redirect);
        }

        localStorage.setItem("current_username", username);

        this.props.history.push({
          pathname: "/",
        });
      } else if (resp.status === 500 || resp.status === 403) {
        if (resp.data.length > 0) {
          alert(resp.data);
        } else {
          alert("Could not perform login. Please try again");
        }
      } else {
        this.setState({
          isCredentialsIncorrect: true,
          errorMessage: resp.data,
        });
      }
    } else {
      alert("Could not perform login. Please try again");
    }
  }

  async postLogin(username, password, redirect) {
    try {
      let payload = {
        username: username,
        password: password,
      };

      if (redirect) payload.redirect = "http://" + redirect;

      return await http.post("/auth/login", payload);
    } catch (err) {
      console.log(err);
      return err.response;
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
      errorMessage,
    } = this.state;

    const { t } = this.props;

    return (
      <div style={{ backgroundColor: "#f2f3f7", height: "100vh" }}>
        <Container fluid className="container-login">
          <div className="row-title">
            <span className="col-brand">
              <img className="navbar-logo" src="favicon.ico" alt="logo"></img>
            </span>
            <span className="col-title">NIDA SMART ENERGY</span>
          </div>

          <Container className="container-form">
            <Row className="row-heading">{t("Login")}</Row>
            <Row>
              <Form>
                <FormGroup row>
                  <Label for="username" sm={2}>
                    {t("Username")}
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
                    {t("Password")}
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
                        checked={showPassword}
                        onChange={this.toggleShowPassword}
                      />{" "}
                      {t("Show Password")}
                    </Label>
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Button
                    id="btn-login"
                    className="btn-login"
                    onClick={this.submitLogin}
                  >
                    {t("Log In")}
                  </Button>
                </FormGroup>
              </Form>
            </Row>
            {isCredentialsIncorrect ? (
              <Row className="row-feedback">{errorMessage}</Row>
            ) : (
              ""
            )}
            {isUsernameEmpty ? (
              <Row className="row-feedback">
                {t("Please fill in your username.")}
              </Row>
            ) : (
              ""
            )}
            {isPasswordEmpty ? (
              <Row className="row-feedback">
                {t("Please fill in your password.")}
              </Row>
            ) : (
              ""
            )}

            <Row className="row-forgot-password">
              <Link to="/forgot-password" className="link">
                {t("Forgot password")}
              </Link>
            </Row>
            <Row className="row-link">
              <Link to="/register" className="link">
                {t("Register")}
              </Link>
            </Row>
          </Container>
        </Container>

        <footer>{t("address")}</footer>
      </div>
    );
  }
}

export default withTranslation()(Login);
