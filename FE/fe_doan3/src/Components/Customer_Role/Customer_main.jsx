import React from "react";
import { useAuth } from "../AuthContext";

function Customer_main() {
  const { user, logout } = useAuth();

  return (
    <div className="customer-main">
      <h1>Chào mừng, {user.name}!</h1>
      <p>Bạn đã đăng nhập với vai trò Khách hàng.</p>
      <p>Email: {user.email}</p>
      <button onClick={logout}>Đăng xuất</button>
      {/* Thêm các component khác cho khách hàng ở đây */}
    </div>
  );
}

export default Customer_main;
