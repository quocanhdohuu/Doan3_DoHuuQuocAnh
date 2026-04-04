import React, { useEffect, useState } from "react";
import "../style/Dichvu.css";
import { FeatureHeader } from "./Common";

const API_URL = "http://localhost:3000/api/services";
const PAGE_SIZE = 4;

const getDefaultForm = () => ({
  ServiceName: "",
  Price: "",
  Status: "TRUE",
});

const mapServiceFromApi = (item) => ({
  ServiceID: item.ServiceID,
  ServiceName: item.ServiceName ?? "",
  Price: Number(item.Price) || 0,
  Status: String(item.Status ?? "TRUE").toUpperCase(),
});

const formatCurrency = (value) =>
  Number(value).toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  });

const isActiveStatus = (status) => String(status).toUpperCase() === "TRUE";

const Dichvu = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editServiceId, setEditServiceId] = useState(null);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(getDefaultForm());
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setServices(Array.isArray(data) ? data.map(mapServiceFromApi) : []);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredList = services.filter((service) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return true;
    }

    return (
      service.ServiceName.toLowerCase().includes(keyword) ||
      String(service.ServiceID).includes(keyword) ||
      String(service.Price).includes(keyword) ||
      String(service.Status).toLowerCase().includes(keyword)
    );
  });

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

  const handleOpenModal = (service = null) => {
    if (service) {
      setForm({
        ServiceName: service.ServiceName || "",
        Price: String(service.Price ?? ""),
        Status: service.Status || "TRUE",
      });
      setEditServiceId(service.ServiceID);
    } else {
      setForm(getDefaultForm());
      setEditServiceId(null);
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditServiceId(null);
    setForm(getDefaultForm());
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.ServiceName.trim()) {
      alert("Vui lòng nhập tên dịch vụ.");
      return;
    }

    const price = Number(form.Price);
    if (Number.isNaN(price) || price < 0) {
      alert("Giá dịch vụ không hợp lệ.");
      return;
    }

    const payload = {
      ServiceName: form.ServiceName.trim(),
      Price: price,
      Status: form.Status,
    };

    try {
      setSubmitLoading(true);
      setError("");

      const isEdit = editServiceId !== null;
      const url = isEdit ? `${API_URL}/${editServiceId}` : API_URL;
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || `API error: ${response.status}`);
      }

      await fetchServices();
      alert(
        isEdit ? "Cập nhật dịch vụ thành công." : "Thêm dịch vụ thành công.",
      );
      handleCloseModal();
    } catch (err) {
      setError(err.message || "Không thể lưu dịch vụ.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (service) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa dịch vụ "${service.ServiceName}"?`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setError("");
      const response = await fetch(`${API_URL}/${service.ServiceID}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || `API error: ${response.status}`);
      }

      await fetchServices();
      alert("Xóa dịch vụ thành công.");
    } catch (err) {
      setError(err.message || "Không thể xóa dịch vụ.");
    }
  };

  return (
    <div className="dichvu-page">
      <div className="dichvu-header-row">
        <FeatureHeader
          title="Quản lý Dịch vụ"
          description="Quản lý danh sách dịch vụ khách sạn"
        />
        <button
          className="add-btn"
          type="button"
          onClick={() => handleOpenModal(null)}
        >
          + Thêm dịch vụ
        </button>
      </div>

      {error && <div className="dichvu-error-banner">{error}</div>}

      <div className="dichvu-table-card">
        <div className="dichvu-search-box">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, tên, giá, trạng thái..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <table className="dichvu-table">
          <thead>
            <tr>
              <th>Mã DV</th>
              <th>Tên dịch vụ</th>
              <th>Giá</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">Đang tải dữ liệu...</td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan="5">Không có dữ liệu dịch vụ.</td>
              </tr>
            ) : (
              paginatedList.map((service) => (
                <tr key={service.ServiceID}>
                  <td>{service.ServiceID}</td>
                  <td>{service.ServiceName}</td>
                  <td>{formatCurrency(service.Price)} đ</td>
                  <td>
                    <span
                      className={`service-status ${isActiveStatus(service.Status) ? "active" : "inactive"}`}
                    >
                      {isActiveStatus(service.Status)
                        ? "Đang hoạt động"
                        : "Tạm dừng"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="icon-btn edit"
                      title="Sửa"
                      onClick={() => handleOpenModal(service)}
                    >
                      <i className="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button
                      type="button"
                      className="icon-btn delete"
                      title="Xóa"
                      onClick={() => handleDelete(service)}
                    >
                      <i className="fa-regular fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && filteredList.length > 0 && (
          <div className="dichvu-pagination">
            <button
              type="button"
              className="dichvu-page-btn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Trang trước"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`dichvu-page-btn ${page === currentPage ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="dichvu-page-btn"
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
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <button
              className="modal-close"
              onClick={handleCloseModal}
              title="Đóng"
              type="button"
            >
              &times;
            </button>
            <h2>
              {editServiceId !== null ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
            </h2>

            <form className="add-service-form" onSubmit={handleSubmit}>
              <label>
                Tên dịch vụ *
                <input
                  type="text"
                  name="ServiceName"
                  value={form.ServiceName}
                  onChange={handleFormChange}
                  required
                  autoFocus
                />
              </label>

              <label>
                Giá (VND) *
                <input
                  type="number"
                  min="0"
                  name="Price"
                  value={form.Price}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label>
                Trạng thái
                <select
                  name="Status"
                  value={form.Status}
                  onChange={handleFormChange}
                >
                  <option value="TRUE">Đang hoạt động</option>
                  <option value="FALSE">Tạm dừng</option>
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseModal}
                >
                  Hủy
                </button>
                <button type="submit" className="save-btn" disabled={submitLoading}>
                  {submitLoading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dichvu;
