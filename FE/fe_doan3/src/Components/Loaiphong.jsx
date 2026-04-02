import React, { Component } from "react";
import "../style/Loaiphong.css";
import { FeatureHeader } from "./Common";

const PAGE_SIZE = 4;

class Loaiphong extends Component {
  state = {
    types: [],
    search: "",
    isModalOpen: false,
    modalMode: "add",
    currentType: {
      id: null,
      name: "",
      description: "",
      capacity: "",
      price: "",
    },
    loading: true,
    error: null,
    currentPage: 1,
  };

  componentDidMount() {
    this.fetchRoomTypes();
  }

  fetchRoomTypes = async () => {
    try {
      this.setState({ loading: true, error: null });
      const response = await fetch("http://localhost:3000/api/get-room-types");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Map API data to component state format
      const mappedTypes = data.map((item) => ({
        id: item.RoomTypeID,
        name: item.Name,
        description: item.Description,
        capacity: item.Capacity,
        price: item.DefaultPrice,
      }));

      this.setState({ types: mappedTypes, loading: false, currentPage: 1 });
    } catch (error) {
      console.error("Error fetching room types:", error);
      this.setState({ error: error.message, loading: false });
    }
  };

  getFilteredTypes = () => {
    const { types, search } = this.state;
    const q = search.toLowerCase().trim();
    if (!q) return types;
    return types.filter(
      (type) =>
        type.name.toLowerCase().includes(q) ||
        type.description.toLowerCase().includes(q),
    );
  };

  openAddModal = () => {
    this.setState({
      isModalOpen: true,
      modalMode: "add",
      currentType: {
        id: null,
        name: "",
        description: "",
        capacity: "",
        price: "",
      },
    });
  };

  openEditModal = (typeItem) => {
    this.setState({
      isModalOpen: true,
      modalMode: "edit",
      currentType: {
        id: typeItem.id,
        name: typeItem.name,
        description: typeItem.description,
        capacity: typeItem.capacity,
        price: typeItem.price,
      },
    });
  };

  closeModal = () => {
    this.setState({ isModalOpen: false });
  };

  handleChange = (field) => (e) => {
    const value = e.target.value;
    this.setState((prev) => ({
      currentType: { ...prev.currentType, [field]: value },
    }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { types, modalMode, currentType } = this.state;
    const { name, description, capacity, price, id } = currentType;

    if (!name || !description || !capacity || !price) {
      alert("Vui lòng điền đủ các trường bắt buộc.");
      return;
    }

    const capacityNum = Number(capacity);
    const priceNum = Number(price);
    if (Number.isNaN(capacityNum) || Number.isNaN(priceNum)) {
      alert("Sức chứa và Giá phải là số.");
      return;
    }

    const data = {
      id: modalMode === "add" ? Math.max(0, ...types.map((t) => t.id)) + 1 : id,
      name: name.trim(),
      description: description.trim(),
      capacity: capacityNum,
      price: priceNum,
    };

    const apiPayload = {
      Name: data.name,
      Description: data.description,
      Capacity: data.capacity,
      DefaultPrice: data.price,
    };

    try {
      if (modalMode === "add") {
        // POST request để thêm loại phòng mới
        const response = await fetch(
          "http://localhost:3000/api/get-room-types",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiPayload),
          },
        );
        if (response.ok) {
          this.setState({ isModalOpen: false });
          await this.fetchRoomTypes(); // Refresh dữ liệu từ API
        } else {
          alert("Lỗi khi thêm loại phòng");
        }
      } else {
        // PUT request để cập nhật loại phòng
        const response = await fetch(
          `http://localhost:3000/api/get-room-types/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiPayload),
          },
        );
        if (response.ok) {
          this.setState({ isModalOpen: false });
          await this.fetchRoomTypes(); // Refresh dữ liệu từ API
        } else {
          alert("Lỗi khi cập nhật loại phòng");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Lỗi: " + error.message);
    }
  };

  render() {
    const {
      search,
      isModalOpen,
      modalMode,
      currentType,
      loading,
      error,
      currentPage,
    } = this.state;
    const filteredTypes = this.getFilteredTypes();
    const totalPages = Math.max(1, Math.ceil(filteredTypes.length / PAGE_SIZE));
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedTypes = filteredTypes.slice(startIndex, startIndex + PAGE_SIZE);

    return (
      <div className="loaiphong">
        <div className="lp-top">
          <FeatureHeader
            title="Quản lý Loại phòng"
            description="Quản lý các loại phòng trong khách sạn"
          />
          <button className="btn-primary" onClick={this.openAddModal}>
            + Thêm loại phòng
          </button>
        </div>

        {error && (
          <div
            className="error-message"
            style={{
              backgroundColor: "#f8d7da",
              color: "#721c24",
              padding: "12px",
              marginBottom: "16px",
              borderRadius: "4px",
            }}
          >
            Lỗi: {error}
            <button
              onClick={this.fetchRoomTypes}
              style={{
                marginLeft: "12px",
                padding: "4px 8px",
                cursor: "pointer",
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        {!loading && (
          <div className="lp-main">
            <div className="lp-actions">
              <div className="lp-search-box">
                <i className="fa fa-search"></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm loại phòng..."
                  value={search}
                  onChange={(e) =>
                    this.setState({ search: e.target.value, currentPage: 1 })
                  }
                />
              </div>
              <div />
            </div>

            <div className="lp-table-wrapper">
              <table className="lp-table">
                <thead>
                  <tr>
                    <th>Tên loại phòng</th>
                    <th>Mô tả</th>
                    <th>Sức chứa</th>
                    <th>Giá cơ bản</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTypes.map((typeItem) => (
                    <tr key={typeItem.id}>
                      <td>{typeItem.name}</td>
                      <td>{typeItem.description}</td>
                      <td>{typeItem.capacity} người</td>
                      <td>{typeItem.price.toLocaleString()}đ</td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => this.openEditModal(typeItem)}
                        >
                          <i className="fa fa-edit"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTypes.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-row">
                        Không có loại phòng phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredTypes.length > 0 && (
              <div className="lp-pagination">
                <button
                  type="button"
                  className="lp-page-btn"
                  onClick={() =>
                    this.setState((prev) => ({
                      currentPage: Math.max(prev.currentPage - 1, 1),
                    }))
                  }
                  disabled={currentPage === 1}
                  aria-label="Trang trước"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`lp-page-btn ${page === currentPage ? "active" : ""}`}
                    onClick={() => this.setState({ currentPage: page })}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="lp-page-btn"
                  onClick={() =>
                    this.setState((prev) => ({
                      currentPage: Math.min(prev.currentPage + 1, totalPages),
                    }))
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Trang sau"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}

        {isModalOpen && (
          <div className="modal-overlay" onClick={this.closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={this.closeModal}>
                ×
              </button>
              <h2>
                {modalMode === "add"
                  ? "Thêm loại phòng mới"
                  : "Chỉnh sửa loại phòng"}
              </h2>
              <form onSubmit={this.handleSubmit}>
                <label>
                  Tên loại phòng *
                  <input
                    className="modal-input"
                    type="text"
                    value={currentType.name}
                    onChange={this.handleChange("name")}
                  />
                </label>

                <label>
                  Mô tả
                  <textarea
                    className="modal-input"
                    value={currentType.description}
                    onChange={this.handleChange("description")}
                  />
                </label>

                <label>
                  Sức chứa (người) *
                  <input
                    className="modal-input"
                    type="number"
                    value={currentType.capacity}
                    onChange={this.handleChange("capacity")}
                  />
                </label>

                <label>
                  Giá cơ bản (VNĐ) *
                  <input
                    className="modal-input"
                    type="number"
                    value={currentType.price}
                    onChange={this.handleChange("price")}
                  />
                </label>

                <div className="modal-buttons">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={this.closeModal}
                  >
                    Hủy
                  </button>
                  <button className="btn-primary" type="submit">
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Loaiphong;
