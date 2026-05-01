import React, { useMemo } from "react";
import { DEFAULT_ROOM_IMAGE } from "./RoomImageUtils";
import "../../style/Customer_main.css";

const STATUS_META = {
  BOOKED: { label: "Confirmed", badgeClass: "exp-detail-badge--booked" },
  CHECKED_IN: {
    label: "Checked In",
    badgeClass: "exp-detail-badge--checked-in",
  },
  COMPLETED: { label: "Completed", badgeClass: "exp-detail-badge--completed" },
  CANCELLED: { label: "Canceled", badgeClass: "exp-detail-badge--cancelled" },
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateLong = (value) => {
  const parsed = toDate(value);
  if (!parsed) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "N/A";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const getNightCount = (checkIn, checkOut) => {
  const inDate = toDate(checkIn);
  const outDate = toDate(checkOut);
  if (!inDate || !outDate) return 1;
  const diff = Math.ceil((outDate.getTime() - inDate.getTime()) / 86400000);
  return Number.isFinite(diff) && diff > 0 ? diff : 1;
};

const buildBookingCode = (reservationId, stayId) => {
  const base = String(reservationId ?? "00").padStart(2, "0");
  const suffix = String(stayId ?? "000")
    .slice(-3)
    .toUpperCase();
  return `${base}-${suffix}`;
};

function Experience_Detail({ experience, onBack, onRebook }) {
  const summary = useMemo(() => {
    if (!experience) return null;

    const totalAmount = Number(experience.totalAmount) || 0;
    const nights = getNightCount(experience.checkIn, experience.checkOut);
    const roomCharge = Math.max(Math.round(totalAmount * 1), 0);
    const perNight = nights > 0 ? Math.round(roomCharge / nights) : 0;

    return {
      nights,
      roomCharge,
      perNight,
      totalAmount,
    };
  }, [experience]);

  if (!experience || !summary) {
    return (
      <main className="customer-main-content customer-experience-detail-content">
        <section className="customer-status-box exp-detail-empty">
          <p>No reservation selected.</p>
          <button
            type="button"
            onClick={onBack}
            className="exp-detail-back-link"
          >
            Quay lại
          </button>
        </section>
      </main>
    );
  }

  const statusMeta = STATUS_META[experience.status] || STATUS_META.BOOKED;
  const guestCount = Number(experience.guests) || 1;
  const guestLabel = guestCount > 1 ? "Guests" : "Guest";

  return (
    <main className="customer-main-content customer-experience-detail-content">
      <section className="exp-detail-shell">
        <header className="exp-detail-head">
          <div>
            <p className="customer-section-label">Past Reservation</p>
            <h1>{experience.roomType || "The Obsidian Suite"}</h1>
            <p className="exp-detail-booking-id">
              Booking ID:{" "}
              {buildBookingCode(experience.reservationId, experience.stayId)}
            </p>
          </div>

          <div className="exp-detail-actions">
            <button
              type="button"
              className="exp-detail-soft-btn"
              onClick={onBack}
            >
              <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
              Quay lại
            </button>
            <button
              type="button"
              className="exp-detail-primary-btn"
              onClick={onRebook}
            >
              <i className="fa-solid fa-rotate-right" aria-hidden="true"></i>
              Đặt lại
            </button>
          </div>
        </header>

        <div className="exp-detail-grid">
          <div className="exp-detail-left">
            <figure className="exp-detail-hero-media">
              <img
                src={experience.imageUrl || DEFAULT_ROOM_IMAGE}
                alt={experience.roomType || "Room image"}
                onError={(event) => {
                  event.currentTarget.src = DEFAULT_ROOM_IMAGE;
                }}
              />
              <figcaption>
                <span>Thời gian lưu trú</span>
                <strong>
                  {formatDateLong(experience.checkIn)} -{" "}
                  {formatDateLong(experience.checkOut)}
                </strong>
              </figcaption>
            </figure>

            <div className="exp-detail-info-grid">
              <article className="exp-detail-card">
                <ul>
                  <li>
                    <i className="fa-solid fa-user" aria-hidden="true"></i>
                    <div>
                      <strong>Số lượng khách</strong>
                      <span>
                        {guestCount} {guestLabel}
                      </span>
                    </div>
                  </li>
                  <li>
                    <i className="fa-solid fa-id-badge" aria-hidden="true"></i>
                    <div>
                      <strong>Reservation #{experience.reservationId}</strong>
                      <span>Status: {statusMeta.label}</span>
                    </div>
                  </li>
                </ul>
              </article>

              <article className="exp-detail-card">
                <h3>Tiện nghi trong phòng</h3>
                <div className="exp-detail-tag-list">
                  <span>Ban công riêng</span>
                  <span>Mini Bar</span>
                  <span>Tự động hóa thông minh</span>
                  <span>King Bed</span>
                  <span>Ưu tiên dịch vụ</span>
                  <span>
                    {experience.quantity} Room
                    {experience.quantity > 1 ? "s" : ""}
                  </span>
                </div>
              </article>
            </div>
          </div>

          <aside className="exp-detail-summary">
            <h3>Tóm tắt hoá đơn</h3>

            <div className="exp-detail-summary-list">
              <div>
                <span>
                  {summary.nights} Đêm x {formatCurrency(summary.perNight)}
                </span>
                <strong>{formatCurrency(summary.roomCharge)}</strong>
              </div>
            </div>

            <div className="exp-detail-total">
              <small>Tổng cộng</small>
              <div>
                <strong>{formatCurrency(summary.totalAmount)}</strong>
                <span className={`exp-detail-badge ${statusMeta.badgeClass}`}>
                  {statusMeta.label}
                </span>
              </div>
            </div>

            <div className="exp-detail-payment">
              <i className="fa-solid fa-credit-card" aria-hidden="true"></i>
              <div>
                <small>Phương thức thanh toán</small>
                <strong>Visa ending in 9928</strong>
              </div>
            </div>

            <button type="button" className="exp-detail-text-btn">
              Báo cáo sự khác biệt trong hóa đơn
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default Experience_Detail;
