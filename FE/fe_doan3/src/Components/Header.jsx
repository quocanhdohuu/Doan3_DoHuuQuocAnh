import React, { Component } from "react";
import "../style/Header.css";
import { LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "./AuthContext";

class HeaderClass extends Component {
  handleLogout = () => {
    this.props.logout();
  };

  render() {
    const { Name, Role } = this.props;
    return (
      <>
        <div className="header">
          <button className="btn-navigation">
            <i className="fa-solid fa-list"></i>
          </button>
          <i className="fa-regular fa-building logo-hotel"></i>
          <h2>QUẢN LÝ KHÁCH SẠN</h2>

          <div className="header-right-text">
            <h5>{Name || "Chưa đăng nhập"}</h5>
            <p>{Role || ""}</p>
          </div>

          <button className="btn-logout" onClick={this.handleLogout}>
            <LogoutOutlined />
          </button>
        </div>
      </>
    );
  }
}

const Header = () => {
  const { user, logout } = useAuth();
  return <HeaderClass Name={user?.name} Role={user?.role} logout={logout} />;
};

export default Header;
