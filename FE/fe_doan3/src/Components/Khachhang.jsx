import React, { useState } from "react";
import "../style/Khachhang.css";
import { FeatureHeader } from "./Common";

const KH_LIST = [
  {
    name: "Nguyễn Văn An",
    phone: "0911111111",
    cmnd: "001234567890",
    email: "pva@gmail.com",
    address: "Hà Nội",
    stay: 0,
    note: "",
  },
  {
    name: "Đỗ Thị Xuân",
    phone: "0922222222",
    cmnd: "001234567891",
    email: "htb@gmail.com",
    address: "TP. Hồ Chí Minh",
    stay: 0,
    note: "",
  },
  {
    name: "Đỗ Văn Nam",
    phone: "0933333333",
    cmnd: "001234567892",
    email: "dvc@gmail.com",
    address: "Đà Nẵng",
    stay: 0,
    note: "",
  },
  {
    name: "Lý Thị Mai",
    phone: "0944444444",
    cmnd: "001234567893",
    email: "ltd@gmail.com",
    address: "Huế",
    stay: 0,
    note: "",
  },
];

const Khachhang = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [customers, setCustomers] = useState(KH_LIST);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    cmnd: "",
    email: "",
    address: "",
    note: "",
  });

  const filteredList = customers.filter(
    (kh) =>
      kh.name.toLowerCase().includes(search.toLowerCase()) ||
      kh.phone.includes(search) ||
      kh.cmnd.includes(search) ||
      kh.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenModal = (index = -1) => {
    if (index >= 0) {
      setForm({ ...customers[index] });
      setEditIndex(index);
    } else {
      setForm({
        name: "",
        phone: "",
        cmnd: "",
        email: "",
        address: "",
        note: "",
      });
      setEditIndex(-1);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditIndex(-1);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nextCustomers = [...customers];
    if (editIndex >= 0) {
      nextCustomers[editIndex] = {
        ...nextCustomers[editIndex],
        ...form,
      };
    } else {
      nextCustomers.push({
        ...form,
        stay: 0,
      });
    }
    setCustomers(nextCustomers);
    handleCloseModal();
  };

  return (
    <div className="khachhang-page">
      <div className="khachhang-header-row">
        <FeatureHeader
          title="Quản lý Khách hàng"
          description="Quản lý thông tin khách hàng"
        />
        <button
          className="add-btn"
          type="button"
          onClick={() => handleOpenModal(-1)}
        >
          + Thêm khách hàng
        </button>
      </div>
      <div className="khachhang-table-card">
        <div className="kh-search-box">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, SĐT, CMND/CCCD, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table className="khachhang-table">
          <thead>
            <tr>
              <th>Họ và tên</th>
              <th>Số điện thoại</th>
              <th>CMND/CCCD</th>
              <th>Email</th>
              <th>Địa chỉ</th>
              <th>Lưu trú</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((kh, idx) => (
              <tr key={idx}>
                <td>{kh.name}</td>
                <td>{kh.phone}</td>
                <td>{kh.cmnd}</td>
                <td>{kh.email}</td>
                <td>{kh.address}</td>
                <td>{kh.stay} lần</td>
                <td>
                  <button
                    type="button"
                    className="icon-btn edit"
                    title="Sửa"
                    onClick={() =>
                      handleOpenModal(
                        customers.findIndex((c) => c.cmnd === kh.cmnd),
                      )
                    }
                  >
                    <i className="fa-regular fa-pen-to-square"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal thêm khách hàng */}
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
              {editIndex >= 0 ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}
            </h2>
            <form className="add-customer-form" onSubmit={handleSubmit}>
              <label>
                Họ và tên *
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  autoFocus
                />
              </label>
              <label>
                Số điện thoại *
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                CMND/CCCD *
                <input
                  type="text"
                  name="cmnd"
                  value={form.cmnd}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                />
              </label>
              <label>
                Địa chỉ
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                />
              </label>
              <label>
                Ghi chú
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleFormChange}
                  rows={2}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseModal}
                >
                  Hủy
                </button>
                <button type="submit" className="save-btn">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Khachhang;
