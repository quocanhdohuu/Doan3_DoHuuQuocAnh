import React, { useEffect, useMemo, useState } from "react";
import "../style/Nhanvien.css";
import { FeatureHeader } from "./Common";

const API_URL = "http://localhost:3000/api/receptionists";
const PAGE_SIZE = 4;

const getDefaultForm = () => ({
  UserID: null,
  Email: "",
  Password: "",
  FullName: "",
  Phone: "",
  Role: "RECEPTIONIST",
});

const mapReceptionistFromApi = (item) => ({
  UserID: item?.UserID ?? item?.userId ?? item?.id ?? null,
  Email: item?.Email ?? "",
  Role: item?.Role ?? "RECEPTIONIST",
  CreatedAt: item?.CreatedAt ?? null,
  FullName: item?.FullName ?? "",
  Phone: item?.Phone ?? "",
});

// Validation functions
const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return "Số điện thoại không được để trống.";
  }
  const phoneRegex = /^(0[1-9][0-9]{8}|0[1-9][0-9]{9})$/;
  const cleanedPhone = phone.replace(/\s/g, "");
  if (!phoneRegex.test(cleanedPhone)) {
    return "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0).";
  }
  return "";
};

const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return "Email không được để trống.";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return "Email không hợp lệ.";
  }
  return "";
};

const validateFullName = (fullName) => {
  if (!fullName || !fullName.trim()) {
    return "Họ tên không được để trống.";
  }
  if (fullName.trim().length < 2) {
    return "Họ tên phải có ít nhất 2 ký tự.";
  }
  if (fullName.trim().length > 100) {
    return "Họ tên không được quá 100 ký tự.";
  }
  return "";
};

const validatePassword = (password, isRequired = false) => {
  if (isRequired && (!password || !password.trim())) {
    return "Mật khẩu không được để trống.";
  }
  if (password && password.trim().length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }
  if (password && password.trim().length > 50) {
    return "Mật khẩu không được quá 50 ký tự.";
  }
  return "";
};

const extractList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const formatRoleLabel = (role) => {
  const normalizedRole = String(role || "").toUpperCase();

  if (normalizedRole === "ADMIN") {
    return "Quản trị viên";
  }

  if (normalizedRole === "RECEPTIONIST") {
    return "Lễ tân";
  }

  return role || "-";
};

const formatCreatedAt = (value) => {
  if (!value) {
    return "-";
  }

  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    return String(value);
  }

  return dateValue.toLocaleDateString("vi-VN");
};

const getRoleBadge = (role) => {
  const normalizedRole = String(role || "").toUpperCase();

  if (normalizedRole === "ADMIN") {
    return (
      <span className="badge admin">
        <span role="img" aria-label="admin">
          <i className="fa-solid fa-shield"></i>
        </span>{" "}
        Quản trị viên
      </span>
    );
  }

  return (
    <span className="badge letan">
      <span role="img" aria-label="receptionist">
        <i className="fa-solid fa-circle-user"></i>
      </span>{" "}
      Lễ tân
    </span>
  );
};

const Nhanvien = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [receptionists, setReceptionists] = useState([]);
  const [form, setForm] = useState(getDefaultForm());
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReceptionists = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const list = extractList(result).map(mapReceptionistFromApi);
      setReceptionists(list);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách nhân viên.");
      setReceptionists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionists();
  }, []);

  const filteredList = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return receptionists;
    }

    return receptionists.filter((nv) => {
      return (
        String(nv.UserID || "").includes(keyword) ||
        nv.FullName.toLowerCase().includes(keyword) ||
        nv.Email.toLowerCase().includes(keyword) ||
        nv.Phone.includes(keyword) ||
        formatRoleLabel(nv.Role).toLowerCase().includes(keyword)
      );
    });
  }, [receptionists, search]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedList = filteredList.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setForm({
        UserID: staff.UserID,
        Email: staff.Email || "",
        Password: "",
        FullName: staff.FullName || "",
        Phone: staff.Phone || "",
        Role: staff.Role || "RECEPTIONIST",
      });
      setEditUserId(staff.UserID);
    } else {
      setForm(getDefaultForm());
      setEditUserId(null);
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditUserId(null);
    setForm(getDefaultForm());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isEdit = editUserId !== null;

    // Validate FullName
    const nameError = validateFullName(form.FullName);
    if (nameError) {
      alert(nameError);
      return;
    }

    // Validate Phone
    const phoneError = validatePhone(form.Phone);
    if (phoneError) {
      alert(phoneError);
      return;
    }

    // Validate Email
    const emailError = validateEmail(form.Email);
    if (emailError) {
      alert(emailError);
      return;
    }

    // Validate Password
    const passwordError = validatePassword(form.Password, !isEdit);
    if (passwordError) {
      alert(passwordError);
      return;
    }

    if (
      isEdit &&
      !window.confirm(
        "Bạn có chắc chắn muốn cập nhật thông tin nhân viên này không?",
      )
    ) {
      return;
    }

    const payload = {
      UserID: isEdit ? editUserId : undefined,
      Email: form.Email.trim(),
      FullName: form.FullName.trim(),
      Phone: form.Phone.trim(),
    };

    if (form.Password.trim()) {
      payload.Password = form.Password.trim();
    }

    try {
      setSubmitLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || `API error: ${response.status}`);
      }

      await fetchReceptionists();
      alert(
        isEdit
          ? "Cập nhật nhân viên thành công."
          : "Thêm nhân viên thành công.",
      );
      handleCloseModal();
    } catch (err) {
      setError(err.message || "Không thể lưu thông tin nhân viên.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (staff) => {
    if (!staff?.UserID) {
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa nhân viên "${staff.FullName || staff.Email}" không?`,
      )
    ) {
      return;
    }

    try {
      setDeletingUserId(staff.UserID);
      setError("");

      const response = await fetch(API_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ UserID: staff.UserID }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || `API error: ${response.status}`);
      }

      await fetchReceptionists();
      alert("Xóa nhân viên thành công.");
    } catch (err) {
      setError(err.message || "Không thể xóa nhân viên.");
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="nhanvien nhanvien-page">
      <div className="nhanvien-header nhanvien-header-row">
        <FeatureHeader
          title="Quản lý Nhân viên"
          description="Quản lý tài khoản nhân viên khách sạn"
        />
        <button
          className="add-btn"
          type="button"
          onClick={() => handleOpenModal(null)}
        >
          + Thêm nhân viên
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            padding: "10px 12px",
            marginBottom: "12px",
          }}
        >
          {error}
        </div>
      )}

      <div className="table-card nhanvien-table-card">
        <div className="kh-search-box nv-search-box">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="nhanvien-table-wrap">
          <table className="nhanvien-table">
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Vai trò</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6">Không có dữ liệu nhân viên.</td>
                </tr>
              ) : (
                paginatedList.map((nv) => (
                  <tr key={nv.UserID || nv.Email}>
                    <td>{nv.FullName || "-"}</td>
                    <td>{getRoleBadge(nv.Role)}</td>
                    <td>{nv.Email || "-"}</td>
                    <td>{nv.Phone || "-"}</td>
                    <td>{formatCreatedAt(nv.CreatedAt)}</td>
                    <td>
                      <button
                        className="icon-btn edit"
                        type="button"
                        title="Sửa"
                        onClick={() => handleOpenModal(nv)}
                        disabled={submitLoading || deletingUserId === nv.UserID}
                      >
                        <span role="img" aria-label="edit">
                          <i className="fa-regular fa-pen-to-square"></i>
                        </span>
                      </button>
                      <button
                        className="icon-btn delete"
                        type="button"
                        title="Xóa"
                        onClick={() => handleDelete(nv)}
                        disabled={submitLoading || deletingUserId === nv.UserID}
                      >
                        <span role="img" aria-label="delete">
                          <i className="fa-regular fa-trash-can"></i>
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredList.length > 0 && (
          <div className="kh-pagination">
            <button
              type="button"
              className="kh-page-btn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Trang trước"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  className={`kh-page-btn ${page === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}

            <button
              type="button"
              className="kh-page-btn"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              aria-label="Trang sau"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={handleCloseModal}
              title="Đóng"
            >
              &times;
            </button>
            <h2>
              {editUserId !== null
                ? "Chỉnh sửa nhân viên"
                : "Thêm nhân viên mới"}
            </h2>
            <form
              key={editUserId !== null ? `edit-${editUserId}` : "add-new"}
              className="add-customer-form"
              autoComplete="off"
              onSubmit={handleSubmit}
            >
              {editUserId === null && (
                <>
                  <input
                    type="text"
                    name="fake_username"
                    autoComplete="username"
                    tabIndex={-1}
                    className="form-hidden-autofill"
                  />
                  <input
                    type="password"
                    name="fake_password"
                    autoComplete="new-password"
                    tabIndex={-1}
                    className="form-hidden-autofill"
                  />
                </>
              )}

              <label>
                Họ và tên *
                <input
                  type="text"
                  name="FullName"
                  value={form.FullName}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </label>
              <label>
                Số điện thoại *
                <input
                  type="tel"
                  name="Phone"
                  value={form.Phone}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Email *
                <input
                  type="email"
                  name="Email"
                  value={form.Email}
                  onChange={handleChange}
                  required
                  autoComplete={editUserId !== null ? "email" : "off"}
                />
              </label>
              <label>
                {editUserId !== null
                  ? "Mật khẩu (để trống nếu không đổi)"
                  : "Mật khẩu *"}
                <input
                  type="password"
                  name="Password"
                  value={form.Password}
                  onChange={handleChange}
                  required={editUserId === null}
                  autoComplete="new-password"
                  placeholder={
                    editUserId !== null
                      ? "Để trống nếu không đổi"
                      : "Nhập mật khẩu"
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseModal}
                  disabled={submitLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={submitLoading}
                >
                  {submitLoading
                    ? "Đang lưu..."
                    : editUserId !== null
                      ? "Cập nhật"
                      : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nhanvien;
