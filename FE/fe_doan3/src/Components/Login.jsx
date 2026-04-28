import React, { Component } from "react";
import "../style/Login.css";
import { useAuth } from "./AuthContext";

class LoginClass extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      message: "",
      loading: false,
    };
  }

  handleChange = (e) => {
    this.setState({
      [e.target.id]: e.target.value,
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ loading: true, message: "" });

    const { email, password } = this.state;

    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: email,
          PasswordHash: password,
        }),
      });

      let result = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (response.ok && result?.account) {
        const rawUserId =
          result.account.UserID ??
          result.account.userId ??
          result.account.userID ??
          null;
        const parsedUserId = Number(rawUserId);

        this.props.login({
          userId:
            Number.isFinite(parsedUserId) && parsedUserId > 0
              ? parsedUserId
              : rawUserId,
          name: result.account.FullName,
          email: result.account.Email,
          role: result.account.Role,
        });

        this.setState({
          message: "Đăng nhập thành công!",
          loading: false,
        });
      } else {
        this.setState({
          message: result?.message || "Sai tài khoản hoặc mật khẩu",
          loading: false,
        });
      }
    } catch (error) {
      console.error(error);
      this.setState({
        message: "Lỗi kết nối API",
        loading: false,
      });
    }
  };

  render() {
    const { loading, message } = this.state;
    const { onOpenRegister } = this.props;

    return (
      <div className="dangnhap">
        <div className="dangnhap-container">
          <i className="fa-regular fa-building logo-hotel-login"></i>

          <div className="dangnhap-top">
            <h3>Hệ thống Quản lý Khách sạn</h3>
            <p>Đăng nhập vào hệ thống</p>
          </div>

          <form className="dangnhap-form" onSubmit={this.handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              id="email"
              placeholder="Nhập email"
              onChange={this.handleChange}
              disabled={loading}
              required
            />

            <label>Mật khẩu</label>
            <input
              type="password"
              id="password"
              placeholder="Nhập mật khẩu"
              onChange={this.handleChange}
              disabled={loading}
              required
            />

            <button
              className="dangnhap-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="dangnhap-footer">
            <span>Chưa có tài khoản?</span>
            <button
              type="button"
              className="dangky-link"
              onClick={onOpenRegister}
              disabled={loading}
            >
              Đăng ký khách hàng
            </button>
          </div>

          {message && <p className="dangnhap-message">{message}</p>}
        </div>
      </div>
    );
  }
}

const Login = ({ onOpenRegister }) => {
  const { login } = useAuth();
  return <LoginClass login={login} onOpenRegister={onOpenRegister} />;
};

export default Login;
