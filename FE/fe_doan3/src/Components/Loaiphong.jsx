import React, { Component } from "react";
import "../style/Loaiphong.css";
import { FeatureHeader } from "./Common";

const PAGE_SIZE = 4;
const ROOM_TYPES_API_URL = "http://localhost:3000/api/get-room-types";
const LOCAL_IMAGE_BASE_URL = "http://localhost:3000/local-images/";

const getFileNameFromPath = (value = "") => {
  const normalized = String(value).trim().replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : "";
};

const buildLocalImageUrl = (fileName = "") => {
  const cleanName = String(fileName).trim();
  if (!cleanName) return "";
  return `${LOCAL_IMAGE_BASE_URL}${encodeURIComponent(cleanName)}`;
};

const normalizeImageUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw) || /^data:image\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("/local-images/")) {
    return `http://localhost:3000${raw}`;
  }

  if (raw.startsWith("local-images/")) {
    return `http://localhost:3000/${raw}`;
  }

  const localSegment = raw.match(/local-images[\\/](.+)$/i);
  if (localSegment?.[1]) {
    return buildLocalImageUrl(getFileNameFromPath(localSegment[1]));
  }

  return buildLocalImageUrl(getFileNameFromPath(raw));
};

const getDefaultType = () => ({
  id: null,
  name: "",
  description: "",
  capacity: "",
  price: "",
  imageUrl: "",
});

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return `${amount.toLocaleString("vi-VN")}đ`;
};

class Loaiphong extends Component {
  constructor(props) {
    super(props);
    this.fileInputRef = React.createRef();
  }

  state = {
    types: [],
    search: "",
    isModalOpen: false,
    modalMode: "add",
    currentType: getDefaultType(),
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
      const response = await fetch(ROOM_TYPES_API_URL);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const payload = await response.json();
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      const mappedTypes = data.map((item) => ({
        id: item?.RoomTypeID ?? item?.id ?? null,
        name: item?.Name ?? item?.name ?? "",
        description: item?.Description ?? item?.description ?? "",
        capacity: item?.Capacity ?? item?.capacity ?? "",
        price: item?.DefaultPrice ?? item?.price ?? "",
        imageUrl: normalizeImageUrl(
          item?.ImageUrl ?? item?.ImageURL ?? item?.Image ?? "",
        ),
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

    return types.filter((type) => {
      const name = String(type.name || "").toLowerCase();
      const description = String(type.description || "").toLowerCase();
      return name.includes(q) || description.includes(q);
    });
  };

  resetFileInput = () => {
    if (this.fileInputRef.current) {
      this.fileInputRef.current.value = "";
    }
  };

  openAddModal = () => {
    this.setState(
      {
        isModalOpen: true,
        modalMode: "add",
        currentType: getDefaultType(),
      },
      this.resetFileInput,
    );
  };

  openEditModal = (typeItem) => {
    this.setState(
      {
        isModalOpen: true,
        modalMode: "edit",
        currentType: {
          id: typeItem.id,
          name: typeItem.name,
          description: typeItem.description,
          capacity: typeItem.capacity,
          price: typeItem.price,
          imageUrl: normalizeImageUrl(typeItem.imageUrl || ""),
        },
      },
      this.resetFileInput,
    );
  };

  closeModal = () => {
    this.setState({ isModalOpen: false }, this.resetFileInput);
  };

  handleChange = (field) => (e) => {
    const value = e.target.value;
    this.setState((prev) => ({
      currentType: { ...prev.currentType, [field]: value },
    }));
  };

  handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn đúng file ảnh.");
      this.resetFileInput();
      return;
    }

    const imageUrl = buildLocalImageUrl(file.name);
    this.setState((prev) => ({
      currentType: {
        ...prev.currentType,
        imageUrl,
      },
    }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { modalMode, currentType } = this.state;
    const { name, description, capacity, price, imageUrl, id } = currentType;

    if (!name || !capacity || !price) {
      alert("Vui lòng điền đủ các trường bắt buộc.");
      return;
    }

    const capacityNum = Number(capacity);
    const priceNum = Number(price);
    if (!Number.isFinite(capacityNum) || !Number.isFinite(priceNum)) {
      alert("Sức chứa và giá phải là số hợp lệ.");
      return;
    }

    const apiPayload = {
      Name: name.trim(),
      Description: String(description || "").trim(),
      Capacity: capacityNum,
      DefaultPrice: priceNum,
      ImageUrl: normalizeImageUrl(imageUrl),
    };

    try {
      const isEdit = modalMode === "edit";
      const url = isEdit ? `${ROOM_TYPES_API_URL}/${id}` : ROOM_TYPES_API_URL;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || `API error: ${response.status}`);
      }

      this.setState({ isModalOpen: false });
      this.resetFileInput();
      await this.fetchRoomTypes();
      alert(isEdit ? "Cập nhật loại phòng thành công." : "Thêm loại phòng thành công.");
    } catch (error) {
      console.error("Error:", error);
      alert(`Lỗi: ${error.message}`);
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
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const paginatedTypes = filteredTypes.slice(startIndex, startIndex + PAGE_SIZE);

    return (
      <div className="loaiphong">
        <div className="lp-top">
          <FeatureHeader
            title="Quản lý Loại phòng"
            description="Quản lý các loại phòng trong khách sạn"
          />
          <button className="lp-btn lp-btn-primary" onClick={this.openAddModal}>
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
                    <th>Ảnh</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTypes.map((typeItem) => (
                    <tr key={typeItem.id}>
                      <td>{typeItem.name}</td>
                      <td>{typeItem.description || "-"}</td>
                      <td>{typeItem.capacity} người</td>
                      <td>{formatCurrency(typeItem.price)}</td>
                      <td>
                        {typeItem.imageUrl ? (
                          <img
                            src={typeItem.imageUrl}
                            alt={typeItem.name}
                            className="lp-room-thumb"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="lp-no-image">Không có ảnh</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="lp-btn-edit"
                          onClick={() => this.openEditModal(typeItem)}
                          type="button"
                        >
                          <i className="fa fa-edit"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTypes.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty-row">
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
                  disabled={safePage === 1}
                  aria-label="Trang trước"
                >
                  {"‹"}
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`lp-page-btn ${page === safePage ? "active" : ""}`}
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
                  disabled={safePage === totalPages}
                  aria-label="Trang sau"
                >
                  {"›"}
                </button>
              </div>
            )}
          </div>
        )}

        {isModalOpen && (
          <div className="lp-modal-overlay" onClick={this.closeModal}>
            <div className="lp-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="lp-modal-close" onClick={this.closeModal} type="button">
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
                    className="lp-modal-input"
                    type="text"
                    value={currentType.name}
                    onChange={this.handleChange("name")}
                    required
                  />
                </label>

                <label>
                  Mô tả
                  <textarea
                    className="lp-modal-input"
                    value={currentType.description}
                    onChange={this.handleChange("description")}
                  />
                </label>

                <label>
                  Sức chứa (người) *
                  <input
                    className="lp-modal-input"
                    type="number"
                    min="1"
                    value={currentType.capacity}
                    onChange={this.handleChange("capacity")}
                    required
                  />
                </label>

                <label>
                  Giá cơ bản (VNĐ) *
                  <input
                    className="lp-modal-input"
                    type="number"
                    min="0"
                    value={currentType.price}
                    onChange={this.handleChange("price")}
                    required
                  />
                </label>

                <label>
                  Ảnh phòng
                  <input
                    ref={this.fileInputRef}
                    className="lp-modal-input"
                    type="file"
                    accept="image/*"
                    onChange={this.handleImageSelect}
                  />
                </label>

                {currentType.imageUrl && (
                  <div className="lp-image-preview-wrap">
                    <img
                      src={currentType.imageUrl}
                      alt="Preview"
                      className="lp-image-preview"
                    />
                  </div>
                )}

                <div className="lp-modal-buttons">
                  <button
                    className="lp-btn lp-btn-secondary"
                    type="button"
                    onClick={this.closeModal}
                  >
                    Hủy
                  </button>
                  <button className="lp-btn lp-btn-primary" type="submit">
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
