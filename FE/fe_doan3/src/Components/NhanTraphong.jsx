import React, { Component } from "react";
import "../style/NhanTraphong.css";
import { FeatureHeader } from "./Common";

class NhanTraphong extends Component {
  serviceOptions = [
    { name: "Giặt ủi", label: "Giặt ủi - 50.000đ", price: 50000 },
    { name: "Dọn phòng", label: "Dọn phòng - 30.000đ", price: 30000 },
    { name: "Đưa đón sân bay", label: "Đưa đón sân bay - 250.000đ", price: 250000 },
    { name: "Bữa sáng", label: "Bữa sáng - 80.000đ", price: 80000 },
  ];

  createId = () => Date.now() + Math.floor(Math.random() * 1000);

  getDefaultServiceItems = () => [
    { id: this.createId(), name: "", qty: 1, price: 0 },
  ];

  getDefaultMinibarItems = () => [
    { id: 1, name: "Pepsi - 30.000đ", qty: 2, price: 30000 },
    { id: 2, name: "Nước suối - 10.000đ", qty: 1, price: 10000 },
  ];

  extractInputDateFromPlan = (plan) => {
    if (!plan) return "";
    const parts = plan.trim().split(" ");
    const datePart = parts[parts.length - 1];
    const [day, month, year] = datePart.split("/");
    if (!day || !month || !year) return "";
    return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  formatInputDate = (value) => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    if (!day || !month || !year) return "";
    return `${Number(day)}/${Number(month)}/${year}`;
  };

  buildCheckOutPlan = (oldPlan, newDate) => {
    const timePart = oldPlan?.split(" ")?.[0] || "12:00:00";
    return `${timePart} ${this.formatInputDate(newDate)}`;
  };

  state = {
    activeTab: "stay",
    showModal: false,
    modalType: null,
    currentItem: null,
    stayData: [
      {
        id: 1,
        guest: "Phạm Văn An",
        room: "406 (Suite)",
        checkInTime: "08:47:05 20/3/2026",
        checkOutPlan: "07:00:00 12/10/2026",
      },
    ],
    bookingData: [
      {
        id: 2,
        guest: "Phạm Văn An",
        roomType: "Suite",
        checkIn: "20/3/2026",
        checkOut: "12/10/2026",
      },
    ],
    walkInForm: {
      name: "",
      phone: "",
      identity: "",
      room: "",
      checkOut: "",
    },
    transferRoom: "",
    transferNote: "",
    extendForm: { info: "", newCheckOut: "" },
    minibarItems: [
      { id: 1, name: "Pepsi - 30.000đ", qty: 2, price: 30000 },
      { id: 2, name: "Nước suối - 10.000đ", qty: 1, price: 10000 },
    ],
    serviceItems: [{ id: Date.now(), name: "", qty: 1, price: 0 }],
    newPenalty: { reason: "", amount: "" },
    penalties: [],
  };

  openModal = (type, item = null) => {
    const nextState = {
      showModal: true,
      modalType: type,
      currentItem: item,
    };

    if (type === "extend") {
      nextState.extendForm = {
        info: "",
        newCheckOut: this.extractInputDateFromPlan(item?.checkOutPlan),
      };
    }

    if (type === "service") {
      nextState.serviceItems = this.getDefaultServiceItems();
    }

    this.setState(nextState);
  };

  closeModal = () => {
    this.setState({
      showModal: false,
      modalType: null,
      currentItem: null,
      walkInForm: { name: "", phone: "", identity: "", room: "", checkOut: "" },
      transferRoom: "",
      transferNote: "",
      extendForm: { info: "", newCheckOut: "" },
      minibarItems: this.getDefaultMinibarItems(),
      serviceItems: this.getDefaultServiceItems(),
      newPenalty: { reason: "", amount: "" },
      penalties: [],
    });
  };

  handleWalkInInput = (field) => (e) => {
    this.setState({
      walkInForm: { ...this.state.walkInForm, [field]: e.target.value },
    });
  };

  handleTransferInput = (field) => (e) => {
    this.setState({ [field]: e.target.value });
  };

  handleExtendInput = (field) => (e) => {
    this.setState({
      extendForm: { ...this.state.extendForm, [field]: e.target.value },
    });
  };

  addMinibarItem = () => {
    this.setState((prev) => ({
      minibarItems: [
        ...prev.minibarItems,
        { id: Date.now(), name: "", qty: 1, price: 0 },
      ],
    }));
  };

  updateMinibarItem = (id, field, value) => {
    this.setState((prev) => ({
      minibarItems: prev.minibarItems.map((item) =>
        item.id === id
          ? { ...item, [field]: field === "qty" ? Number(value) : value }
          : item,
      ),
    }));
  };

  removeMinibarItem = (id) => {
    this.setState((prev) => ({
      minibarItems: prev.minibarItems.filter((item) => item.id !== id),
    }));
  };

  addServiceItem = () => {
    this.setState((prev) => ({
      serviceItems: [
        ...prev.serviceItems,
        { id: this.createId(), name: "", qty: 1, price: 0 },
      ],
    }));
  };

  updateServiceItem = (id, field, value) => {
    this.setState((prev) => ({
      serviceItems: prev.serviceItems.map((item) => {
        if (item.id !== id) return item;

        if (field === "name") {
          const selected = this.serviceOptions.find((service) => service.name === value);
          return { ...item, name: value, price: selected ? selected.price : 0 };
        }

        if (field === "qty") {
          return { ...item, qty: Math.max(1, Number(value) || 1) };
        }

        return { ...item, [field]: value };
      }),
    }));
  };

  removeServiceItem = (id) => {
    this.setState((prev) => {
      const nextItems = prev.serviceItems.filter((item) => item.id !== id);
      return {
        serviceItems: nextItems.length
          ? nextItems
          : [{ id: this.createId(), name: "", qty: 1, price: 0 }],
      };
    });
  };

  addPenalty = () => {
    const { newPenalty, penalties } = this.state;
    if (!newPenalty.reason || !newPenalty.amount) return;
    this.setState({
      penalties: [...penalties, { ...newPenalty, id: Date.now() }],
      newPenalty: { reason: "", amount: "" },
    });
  };

  removePenalty = (id) => {
    this.setState((prev) => ({
      penalties: prev.penalties.filter((p) => p.id !== id),
    }));
  };

  changeTab = (tab) => this.setState({ activeTab: tab });

  handleConfirmModal = () => {
    const { modalType, currentItem, extendForm } = this.state;

    if (modalType === "extend") {
      if (!extendForm.newCheckOut) {
        alert("Vui lòng chọn ngày Check-out mới.");
        return;
      }

      const currentDate = this.extractInputDateFromPlan(currentItem?.checkOutPlan);
      if (currentDate && extendForm.newCheckOut <= currentDate) {
        alert("Ngày Check-out mới phải lớn hơn ngày dự kiến hiện tại.");
        return;
      }

      this.setState(
        (prev) => ({
          stayData: prev.stayData.map((item) =>
            item.id === currentItem?.id
              ? {
                  ...item,
                  checkOutPlan: this.buildCheckOutPlan(item.checkOutPlan, extendForm.newCheckOut),
                }
              : item,
          ),
        }),
        this.closeModal,
      );
      return;
    }

    this.closeModal();
  };

  renderModal() {
    const {
      modalType,
      currentItem,
      walkInForm,
      transferRoom,
      transferNote,
      extendForm,
      minibarItems,
      serviceItems,
      newPenalty,
      penalties,
    } = this.state;

    if (!modalType) return null;

    const overlayClick = (e) => {
      if (e.target.classList.contains("nhan-modal-overlay")) this.closeModal();
    };

    const subtotal = minibarItems.reduce((sum, i) => sum + i.qty * i.price, 0);
    const penaltyTotal = penalties.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
    const serviceTotal = serviceItems.reduce((sum, i) => sum + i.qty * i.price, 0);

    return (
      <div className="nhan-modal-overlay" onClick={overlayClick}>
        <div className="nhan-modal" onClick={(e) => e.stopPropagation()}>
          <div className="nhan-modal-title-row">
            <h2>
              {modalType === "walkin" && "Check-in Walk-in"}
              {modalType === "checkin" && "Check-in khách hàng"}
              {modalType === "transfer" && "Chuyển phòng"}
              {modalType === "extend" && "Gia hạn lưu trú"}
              {modalType === "service" && "Gọi dịch vụ"}
              {modalType === "checkout" && "Check-out khách hàng"}
            </h2>
            <button className="nhan-close-btn" onClick={this.closeModal}>
              ×
            </button>
          </div>

          {modalType === "walkin" && (
            <>
              <div className="field">
                <label>Họ tên *</label>
                <input
                  placeholder="Họ tên *"
                  value={walkInForm.name}
                  onChange={this.handleWalkInInput("name")}
                />
              </div>
              <div className="field">
                <label>Số điện thoại *</label>
                <input
                  placeholder="Số điện thoại *"
                  value={walkInForm.phone}
                  onChange={this.handleWalkInInput("phone")}
                />
              </div>
              <div className="field">
                <label>CMND/CCCD *</label>
                <input
                  placeholder="CMND/CCCD *"
                  value={walkInForm.identity}
                  onChange={this.handleWalkInInput("identity")}
                />
              </div>
              <div className="field">
                <label>Chọn phòng *</label>
                <select
                  value={walkInForm.room}
                  onChange={this.handleWalkInInput("room")}
                >
                  <option value="">Chọn phòng</option>
                  <option value="406 (Suite)">406 (Suite)</option>
                  <option value="407 (Standard)">407 (Standard)</option>
                </select>
              </div>
              <div className="field">
                <label>Ngày trả phòng dự kiến *</label>
                <input
                  type="date"
                  value={walkInForm.checkOut}
                  onChange={this.handleWalkInInput("checkOut")}
                />
              </div>
            </>
          )}

          {modalType === "checkin" && (
            <>
              <div className="field">
                <label>Khách hàng</label>
                <div className="readonly">{currentItem?.guest}</div>
              </div>
              <div className="field">
                <label>Chọn phòng *</label>
                <select>
                  <option>406 (Suite)</option>
                  <option>407 (Standard)</option>
                </select>
              </div>
            </>
          )}

          {modalType === "transfer" && (
            <>
              <div className="field">
                <label>Phòng hiện tại</label>
                <div className="readonly">
                  {currentItem?.room || "406 - Suite"}
                </div>
              </div>
              <div className="field">
                <label>Phòng mới *</label>
                <select
                  value={transferRoom}
                  onChange={this.handleTransferInput("transferRoom")}
                >
                  <option value="">Chọn phòng mới</option>
                  <option value="502 - Deluxe">502 - Deluxe</option>
                  <option value="503 - Premium">503 - Premium</option>
                </select>
              </div>
              <div className="field">
                <label>Lý do chuyển phòng</label>
                <textarea
                  rows={3}
                  placeholder="VD: Khách yêu cầu, nâng hạng phòng, sự cố kỹ thuật..."
                  value={transferNote}
                  onChange={this.handleTransferInput("transferNote")}
                />
              </div>
              <div className="note-box">
                Lưu ý: Tiền phòng sẽ được tính riêng theo từng phòng khách ở.
                Phòng cũ sẽ chuyển sang trạng thái "Dọn dẹp".
              </div>
            </>
          )}

          {modalType === "extend" && (
            <>
              <div className="field">
                <label>Khách hàng</label>
                <div className="readonly">{currentItem?.guest}</div>
              </div>
              <div className="field">
                <label>Phòng</label>
                <div className="readonly">{currentItem?.room}</div>
              </div>
              <div className="field">
                <label>Thông tin gia hạn</label>
                <textarea
                  rows={3}
                  placeholder="Nhập thông tin gia hạn (lý do, yêu cầu đặc biệt...)"
                  value={extendForm.info}
                  onChange={this.handleExtendInput("info")}
                />
              </div>
              <div className="field">
                <label>Ngày Check-out mới *</label>
                <input
                  type="date"
                  value={extendForm.newCheckOut}
                  onChange={this.handleExtendInput("newCheckOut")}
                />
              </div>
            </>
          )}

          {modalType === "service" && (
            <>
              <div className="field">
                <label>Khách hàng</label>
                <div className="readonly">{currentItem?.guest}</div>
              </div>
              <div className="field">
                <label>Phòng</label>
                <div className="readonly">{currentItem?.room}</div>
              </div>
              <div className="sub-title">Dịch vụ sử dụng</div>
              {serviceItems.map((item) => (
                <div key={item.id} className="minibar-row">
                  <select
                    value={item.name}
                    onChange={(e) =>
                      this.updateServiceItem(item.id, "name", e.target.value)
                    }
                  >
                    <option value="">Chọn dịch vụ</option>
                    {this.serviceOptions.map((service) => (
                      <option key={service.name} value={service.name}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) =>
                      this.updateServiceItem(item.id, "qty", e.target.value)
                    }
                  />
                  <button
                    className="btn-danger"
                    onClick={() => this.removeServiceItem(item.id)}
                  >
                    Xóa
                  </button>
                </div>
              ))}
              <button
                className="btn btn-secondary btn-add"
                onClick={this.addServiceItem}
              >
                Thêm dịch vụ
              </button>
              <div className="total-row">
                <span>Tổng dịch vụ:</span>
                <strong>{serviceTotal.toLocaleString()}đ</strong>
              </div>
            </>
          )}

          {modalType === "checkout" && (
            <>
              <div className="field">
                <label>Khách hàng</label>
                <div className="readonly">{currentItem?.guest}</div>
              </div>
              <div className="sub-title">Minibar</div>
              {minibarItems.map((item) => (
                <div key={item.id} className="minibar-row">
                  <select
                    value={item.name}
                    onChange={(e) =>
                      this.updateMinibarItem(item.id, "name", e.target.value)
                    }
                  >
                    <option value="Pepsi - 30.000đ">Pepsi - 30.000đ</option>
                    <option value="Nước suối - 10.000đ">
                      Nước suối - 10.000đ
                    </option>
                    <option value="Snack - 20.000đ">Snack - 20.000đ</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) =>
                      this.updateMinibarItem(item.id, "qty", e.target.value)
                    }
                  />
                  <button
                    className="btn-danger"
                    onClick={() => this.removeMinibarItem(item.id)}
                  >
                    Xóa
                  </button>
                </div>
              ))}
              <button
                className="btn btn-secondary btn-add"
                onClick={this.addMinibarItem}
              >
                Thêm minibar
              </button>
              <div className="sub-title">Phí phạt</div>
              <div className="penalty-row">
                <input
                  placeholder="Lý do phạt"
                  value={newPenalty.reason}
                  onChange={(e) =>
                    this.setState({
                      newPenalty: { ...newPenalty, reason: e.target.value },
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Số tiền"
                  value={newPenalty.amount}
                  onChange={(e) =>
                    this.setState({
                      newPenalty: { ...newPenalty, amount: e.target.value },
                    })
                  }
                />
                <button className="btn btn-secondary" onClick={this.addPenalty}>
                  Thêm
                </button>
              </div>
              {penalties.length > 0 && (
                <div className="penalty-list">
                  {penalties.map((p) => (
                    <div key={p.id} className="penalty-item">
                      <span>{p.reason}</span>
                      <div className="penalty-actions">
                        <strong>{Number(p.amount).toLocaleString()}đ</strong>
                        <button
                          className="btn btn-danger"
                          onClick={() => this.removePenalty(p.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="total-row">
                <span>Tổng:</span>
                <strong>{(subtotal + penaltyTotal).toLocaleString()}đ</strong>
              </div>
            </>
          )}

          <div className="nhan-modal-actions">
            <button className="btn btn-secondary" onClick={this.closeModal}>
              {modalType === "service" ? "Đóng" : "Hủy"}
            </button>
            {modalType !== "service" && (
              <button className="btn btn-primary" onClick={this.handleConfirmModal}>
                {modalType === "checkout"
                  ? "Xác nhận Check-out"
                  : modalType === "transfer"
                    ? "Xác nhận chuyển"
                    : modalType === "extend"
                      ? "Xác nhận gia hạn"
                      : "Check-in"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { activeTab, showModal, stayData, bookingData } = this.state;

    return (
      <div className="nhantraphong">
        <div className="page-header">
          <FeatureHeader
            title="Nhận/Trả phòng"
            description="Quản lý check-in và check-out khách hàng"
          />
          <button
            className="btn btn-primary"
            onClick={() => this.openModal("walkin")}
          >
            Walk-in
          </button>
        </div>

        <div className="tab-panel">
          <button
            className={activeTab === "stay" ? "active" : ""}
            onClick={() => this.changeTab("stay")}
          >
            Đang lưu trú ({stayData.length})
          </button>
          <button
            className={activeTab === "pending" ? "active" : ""}
            onClick={() => this.changeTab("pending")}
          >
            Đặt phòng chờ nhận ({bookingData.length})
          </button>
        </div>

        <div className="section-card">
          <h2>
            {activeTab === "stay" ? "Khách đang lưu trú" : "Đặt phòng chờ nhận"}
          </h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>{activeTab === "stay" ? "Phòng" : "Loại phòng"}</th>
                  <th>{activeTab === "stay" ? "Check-in" : "Ngày nhận"}</th>
                  <th>
                    {activeTab === "stay" ? "Dự kiến check-out" : "Ngày trả"}
                  </th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === "stay" &&
                  stayData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.guest}</td>
                      <td>{item.room}</td>
                      <td>{item.checkInTime}</td>
                      <td>{item.checkOutPlan}</td>
                      <td>
                        <div className="action-group">
                          <button
                            className="icon-action"
                            onClick={() => this.openModal("transfer", item)}
                          >
                            Chuyển phòng
                          </button>
                          <button
                            className="icon-action"
                            onClick={() => this.openModal("extend", item)}
                          >
                            Gia hạn
                          </button>
                          <button
                            className="icon-action"
                            onClick={() => this.openModal("service", item)}
                          >
                            Gọi dịch vụ
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => this.openModal("checkout", item)}
                          >
                            Check-out
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {activeTab === "pending" &&
                  bookingData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.guest}</td>
                      <td>{item.roomType}</td>
                      <td>{item.checkIn}</td>
                      <td>{item.checkOut}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => this.openModal("checkin", item)}
                        >
                          Check-in
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && this.renderModal()}
      </div>
    );
  }
}

export default NhanTraphong;
