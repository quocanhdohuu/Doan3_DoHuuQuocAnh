import { useState } from "react";
import "../style/Register.css";

function Register({ onBackToLogin, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setIsError(true);
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/login/register-customer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            FullName: formData.fullName,
            Phone: formData.phone,
            Email: formData.email,
            PasswordHash: formData.password,
          }),
        },
      );

      const rawResponse = await response.text();
      let parsedResponse = null;

      try {
        parsedResponse = rawResponse ? JSON.parse(rawResponse) : null;
      } catch {
        parsedResponse = null;
      }

      if (response.ok) {
        setIsError(false);
        setMessage(
          parsedResponse?.message || "Đăng ký thành công. Vui lòng đăng nhập.",
        );
        setFormData({
          fullName: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        if (onRegisterSuccess) {
          setTimeout(() => {
            onRegisterSuccess();
          }, 800);
        }
      } else {
        setIsError(true);
        setMessage(
          parsedResponse?.message ||
            rawResponse ||
            "Đăng ký thất bại, vui lòng thử lại.",
        );
      }
    } catch (error) {
      console.error(error);
      setIsError(true);
      setMessage("Lỗi kết nối API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>Đăng ký khách hàng</h2>
        <p>Tạo tài khoản để đặt phòng và sử dụng dịch vụ</p>

        <form className="register-form" onSubmit={handleSubmit}>
          <label htmlFor="fullName">Họ và tên</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Nhập họ và tên"
            required
            disabled={loading}
          />

          <label htmlFor="phone">Số điện thoại</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại"
            required
            disabled={loading}
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập email"
            required
            disabled={loading}
          />

          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            required
            minLength={3}
            disabled={loading}
          />

          <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu"
            required
            minLength={3}
            disabled={loading}
          />

          <button type="submit" className="register-submit" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <button
          type="button"
          className="register-back"
          onClick={onBackToLogin}
          disabled={loading}
        >
          Quay lại đăng nhập
        </button>

        {message && (
          <p className={`register-message ${isError ? "error" : "success"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Register;
