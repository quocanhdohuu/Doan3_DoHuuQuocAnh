import React, { Component } from "react";
import "../style/Quanlygia.css";
import { FeatureHeader } from "./Common";

const PAGE_SIZE = 4;
const RATES_API_URL = "http://localhost:3000/api/rates";
const ROOM_TYPES_API_URL = "http://localhost:3000/api/get-room-types";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN").format(date);
};

const toInputDate = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildDateRangeLabel = (startDate, endDate, fallback = "") => {
  const startLabel = startDate ? formatDate(startDate) : "";
  const endLabel = endDate ? formatDate(endDate) : "";

  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
  if (startLabel) return startLabel;
  if (endLabel) return endLabel;
  return fallback;
};

class Quanlygia extends Component {
  state = {
    search: "",
    currentPage: 1,
    isModalOpen: false,
    modalMode: "add",
    submitLoading: false,
    deletingRateId: null,
    currentPrice: {
      id: null,
      roomTypeId: "",
      roomType: "",
      amount: "",
      seasonName: "",
      startDate: "",
      endDate: "",
      defaultPrice: "",
    },
    seasonalPrices: [],
    roomTypes: [],
    loading: false,
    error: null,
  };

  componentDidMount() {
    this.fetchRoomTypes();
    this.fetchRates();
  }

  fetchRoomTypes = async () => {
    try {
      const response = await fetch(ROOM_TYPES_API_URL);
      if (!response.ok) {
        throw new Error(`Loi tai loai phong: ${response.status}`);
      }

      const data = await response.json();
      const roomTypes = (Array.isArray(data) ? data : [])
        .map((item) => ({
          id: item?.RoomTypeID,
          name: item?.Name || "",
        }))
        .filter((item) => item.id && item.name);

      if (roomTypes.length > 0) {
        this.setState({ roomTypes });
      }
    } catch (error) {
      console.error("Khong the tai danh sach loai phong:", error);
    }
  };

  fetchRates = async () => {
    this.setState({ loading: true, error: null });

    try {
      const response = await fetch(RATES_API_URL);
      if (!response.ok) {
        throw new Error(`Loi tai du lieu: ${response.status}`);
      }

      const data = await response.json();
      const seasonalPrices = [];
      const roomTypeMap = new Map();

      (Array.isArray(data) ? data : []).forEach((item) => {
        if (item.RoomTypeID && item.RoomTypeName) {
          roomTypeMap.set(item.RoomTypeID, item.RoomTypeName);
        }

        seasonalPrices.push({
          id: item.RateID ?? item.id,
          roomTypeId: item.RoomTypeID ?? "",
          roomType: item.RoomTypeName || "",
          seasonName: item.Season || "",
          startDate: toInputDate(item.StartDate),
          endDate: toInputDate(item.EndDate),
          dateRange: buildDateRangeLabel(item.StartDate, item.EndDate, ""),
          defaultPrice: item.DefaultPrice ?? 0,
          amount: Number(item.Price ?? 0),
        });
      });

      const roomTypesFromRates = Array.from(roomTypeMap.entries()).map(([id, name]) => ({
        id,
        name,
      }));

      this.setState((prev) => ({
        seasonalPrices,
        roomTypes: prev.roomTypes.length > 0 ? prev.roomTypes : roomTypesFromRates,
        currentPage: 1,
        loading: false,
      }));
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  };

  openAddPriceModal = () => {
    this.setState({
      isModalOpen: true,
      modalMode: "add",
      currentPrice: {
        id: null,
        roomTypeId: "",
        roomType: "",
        amount: "",
        seasonName: "",
        startDate: "",
        endDate: "",
        defaultPrice: "",
      },
    });
  };

  openEditPriceModal = (price) => {
    this.setState({
      isModalOpen: true,
      modalMode: "edit",
      currentPrice: {
        ...price,
        roomTypeId: String(price.roomTypeId || ""),
        startDate: toInputDate(price.startDate),
        endDate: toInputDate(price.endDate),
      },
    });
  };

  closeModal = () => {
    this.setState({ isModalOpen: false });
  };

  handleInput = (field) => (e) => {
    const value = e.target.value;
    this.setState((prev) => ({
      currentPrice: { ...prev.currentPrice, [field]: value },
    }));
  };

  handleSave = async (e) => {
    e.preventDefault();
    const { currentPrice, modalMode } = this.state;
    const { id, roomTypeId, amount, seasonName, startDate, endDate } = currentPrice;

    if (!roomTypeId || !amount || !seasonName || !startDate || !endDate) {
      alert("Vui long dien day du cac truong bat buoc.");
      return;
    }

    if (startDate > endDate) {
      alert("Ngay ket thuc phai lon hon hoac bang ngay bat dau.");
      return;
    }

    const roomTypeIdNum = Number(roomTypeId);
    if (Number.isNaN(roomTypeIdNum)) {
      alert("Loai phong khong hop le.");
      return;
    }

    const amountText = String(amount).trim();
    const isValidPrice = /^\d+(\.\d{1,2})?$/.test(amountText);
    if (!isValidPrice || Number(amountText) <= 0) {
      alert("Gia phai la so lon hon 0.");
      return;
    }

    const payload = {
      RoomTypeID: roomTypeIdNum,
      Price: Number(amountText),
      StartDate: startDate,
      EndDate: endDate,
      Season: seasonName.trim(),
    };

    try {
      this.setState({ submitLoading: true, error: null });

      const url = modalMode === "add" ? RATES_API_URL : `${RATES_API_URL}/${id}`;
      const response = await fetch(url, {
        method: modalMode === "add" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || `API error: ${response.status}`);
      }

      await this.fetchRates();
      this.setState({ isModalOpen: false });
      alert(modalMode === "add" ? "Them gia thanh cong." : "Cap nhat gia thanh cong.");
    } catch (error) {
      this.setState({ error: error.message || "Khong the luu gia." });
    } finally {
      this.setState({ submitLoading: false });
    }
  };

  handleDelete = async (id) => {
    if (!window.confirm("Xac nhan xoa?")) return;

    try {
      this.setState({ deletingRateId: id, error: null });
      const response = await fetch(`${RATES_API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || `API error: ${response.status}`);
      }

      await this.fetchRates();
      alert("Xoa gia thanh cong.");
    } catch (error) {
      this.setState({ error: error.message || "Khong the xoa gia." });
    } finally {
      this.setState({ deletingRateId: null });
    }
  };

  filterPrices = () => {
    const { search, seasonalPrices } = this.state;
    const q = search.trim().toLowerCase();

    if (!q) return seasonalPrices;

    return seasonalPrices.filter(
      (item) =>
        item.roomType.toLowerCase().includes(q) ||
        (item.seasonName && item.seasonName.toLowerCase().includes(q)) ||
        String(item.amount).toLowerCase().includes(q) ||
        buildDateRangeLabel(item.startDate, item.endDate, item.dateRange || "")
          .toLowerCase()
          .includes(q),
    );
  };

  render() {
    const {
      isModalOpen,
      modalMode,
      currentPrice,
      search,
      currentPage,
      loading,
      error,
      roomTypes,
      submitLoading,
      deletingRateId,
    } = this.state;
    const list = this.filterPrices();
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const currentDisplayPage = Math.min(currentPage, totalPages);
    const startIndex = (currentDisplayPage - 1) * PAGE_SIZE;
    const paginatedList = list.slice(startIndex, startIndex + PAGE_SIZE);
    const typeOptions = roomTypes;

    return (
      <div className="qlgia-page">
        <div className="qlgia-top">
          <FeatureHeader title="Quản lý Giá phòng" description="Quản lý giá theo mùa" />
          <button className="qlgia-btn-primary" onClick={this.openAddPriceModal}>
            + Thêm giá
          </button>
        </div>

        <div className="qlgia-main">
          <div className="qlgia-actions">
            <div className="qlgia-search-box">
              <i className="fa fa-search"></i>
              <input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) =>
                  this.setState({ search: e.target.value, currentPage: 1 })
                }
              />
            </div>
          </div>

          <div className="qlgia-table-wrapper">
            <table className="qlgia-table">
              <thead>
                <tr>
                  <th>Loại phòng</th>
                  <th>Tên mùa</th>
                  <th>Thời gian</th>
                  <th>Giá mặc định</th>
                  <th>Giá hiện hành</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="qlgia-empty">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="qlgia-empty">
                      {error}
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="qlgia-empty">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((item) => (
                    <tr key={item.id}>
                      <td>{item.roomType}</td>
                      <td>{item.seasonName}</td>
                      <td>
                        {buildDateRangeLabel(
                          item.startDate,
                          item.endDate,
                          item.dateRange || "",
                        )}
                      </td>
                      <td>{(item.defaultPrice ?? 0).toLocaleString()}đ</td>
                      <td>{item.amount.toLocaleString()}đ</td>
                      <td>
                        <button
                          className="qlgia-btn-edit"
                          onClick={() => this.openEditPriceModal(item)}
                          disabled={submitLoading || deletingRateId === item.id}
                        >
                          <i className="fa fa-edit"></i>
                        </button>
                        <button
                          className="qlgia-btn-delete"
                          onClick={() => this.handleDelete(item.id)}
                          disabled={submitLoading || deletingRateId === item.id}
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && list.length > 0 && (
            <div className="qlgia-pagination">
              <button
                type="button"
                className="qlgia-page-btn"
                onClick={() =>
                  this.setState({
                    currentPage: Math.max(currentDisplayPage - 1, 1),
                  })
                }
                disabled={currentDisplayPage === 1}
                aria-label="Trang trước"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`qlgia-page-btn ${page === currentDisplayPage ? "active" : ""}`}
                  onClick={() => this.setState({ currentPage: page })}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="qlgia-page-btn"
                onClick={() =>
                  this.setState({
                    currentPage: Math.min(currentDisplayPage + 1, totalPages),
                  })
                }
                disabled={currentDisplayPage === totalPages}
                aria-label="Trang sau"
              >
                ›
              </button>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="qlgia-modal-overlay" onClick={this.closeModal}>
            <div className="qlgia-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="qlgia-modal-close" onClick={this.closeModal}>
                ×
              </button>
              <h2>{modalMode === "add" ? "Thêm giá mới" : "Chỉnh sửa giá"}</h2>
              <form onSubmit={this.handleSave}>
                <label>
                  Loại phòng *
                  <select
                    className="qlgia-modal-input"
                    value={currentPrice.roomTypeId || ""}
                    onChange={(e) => {
                      const selected = typeOptions.find(
                        (item) => String(item.id) === e.target.value,
                      );

                      this.setState((prev) => ({
                        currentPrice: {
                          ...prev.currentPrice,
                          roomTypeId: e.target.value,
                          roomType: selected?.name || "",
                        },
                      }));
                    }}
                  >
                    <option value="">
                      {typeOptions.length > 0 ? "Chọn loại phòng" : "Không có loại phòng"}
                    </option>
                    {typeOptions.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Tên mùa *
                  <input
                    className="qlgia-modal-input"
                    value={currentPrice.seasonName}
                    onChange={this.handleInput("seasonName")}
                  />
                </label>

                <div className="qlgia-date-row">
                  <label>
                    Ngày bắt đầu *
                    <input
                      className="qlgia-modal-input"
                      type="date"
                      value={currentPrice.startDate || ""}
                      onChange={this.handleInput("startDate")}
                    />
                  </label>

                  <label>
                    Ngày kết thúc *
                    <input
                      className="qlgia-modal-input"
                      type="date"
                      value={currentPrice.endDate || ""}
                      onChange={this.handleInput("endDate")}
                    />
                  </label>
                </div>

                <label>
                  Giá (VNĐ) *
                  <input
                    className="qlgia-modal-input"
                    type="number"
                    value={currentPrice.amount}
                    onChange={this.handleInput("amount")}
                  />
                </label>

                <div className="qlgia-modal-btns">
                  <button className="qlgia-btn-secondary" type="button" onClick={this.closeModal}>
                    Hủy
                  </button>
                  <button className="qlgia-btn-primary" type="submit" disabled={submitLoading}>
                    {submitLoading ? "Đang lưu..." : "Lưu"}
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

export default Quanlygia;
