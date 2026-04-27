import React, { useEffect, useMemo, useState } from "react";
import "../../style/Booking_Confirm.css";
import hotelImage from "../../img/hotel_image.png";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (inputDate, days = 1) => {
  const value = new Date(`${inputDate}T00:00:00`);
  if (Number.isNaN(value.getTime())) {
    const today = new Date();
    today.setDate(today.getDate() + Math.max(1, days));
    return toInputDate(today);
  }
  value.setDate(value.getDate() + days);
  return toInputDate(value);
};

const parseDate = (inputDate) => {
  if (!inputDate) return null;
  const value = new Date(`${inputDate}T00:00:00`);
  return Number.isNaN(value.getTime()) ? null : value;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const getNightCount = (checkInDate, checkOutDate) => {
  const checkIn = parseDate(checkInDate);
  const checkOut = parseDate(checkOutDate);
  if (!checkIn || !checkOut) return 1;
  const diff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
  return Math.max(1, diff);
};

const normalizeGuestCount = (value, fallback) =>
  Math.max(1, Math.floor(Number(value) || fallback || 1));

const normalizeRoomCount = (value) =>
  Math.max(1, Math.floor(Number(value) || 1));

function Booking_Confirm({ room, bookingDraft, onBack, onBookingDraftChange }) {
  const todayDate = useMemo(() => toInputDate(new Date()), []);
  const [checkInDate, setCheckInDate] = useState(
    bookingDraft?.checkInDate || todayDate,
  );
  const [checkOutDate, setCheckOutDate] = useState(
    bookingDraft?.checkOutDate ||
      addDays(bookingDraft?.checkInDate || todayDate, 1),
  );
  const [guestCount, setGuestCount] = useState(
    normalizeGuestCount(bookingDraft?.guestCount, room?.capacity),
  );
  const [roomCount, setRoomCount] = useState(
    normalizeRoomCount(bookingDraft?.roomCount),
  );

  useEffect(() => {
    if (typeof onBookingDraftChange !== "function") return;
    onBookingDraftChange({
      checkInDate,
      checkOutDate,
      guestCount,
      roomCount,
    });
  }, [checkInDate, checkOutDate, guestCount, roomCount, onBookingDraftChange]);

  const roomName = room?.name || "Selected Room";
  const roomImage = room?.image || hotelImage;
  const nightlyRate = Math.max(0, Number(room?.price) || 0);
  const nights = getNightCount(checkInDate, checkOutDate);
  const subTotal = nightlyRate * nights * roomCount;
  const taxesAndFees = subTotal * 0.088;
  const serviceCharge = subTotal * 0.021;
  const total = subTotal + taxesAndFees + serviceCharge;

  const handleCheckInChange = (event) => {
    const nextCheckIn = event.target.value;
    setCheckInDate(nextCheckIn);
    if (!checkOutDate || checkOutDate <= nextCheckIn) {
      setCheckOutDate(addDays(nextCheckIn, 1));
    }
  };

  const handleCheckOutChange = (event) => {
    const nextCheckOut = event.target.value;
    if (!nextCheckOut) return;
    setCheckOutDate(
      nextCheckOut <= checkInDate ? addDays(checkInDate, 1) : nextCheckOut,
    );
  };

  return (
    <section className="booking-confirm-page">
      <div className="booking-confirm-shell">
        <header className="booking-confirm-head">
          <button
            type="button"
            className="booking-confirm-back"
            onClick={onBack}
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            Quay lại chi tiết phòng
          </button>
          <h1>Xác nhận đặt phòng</h1>
          <p>
            Vui lòng kiểm tra lại thông tin chuyến đi của bạn trước khi xác
            nhận.
          </p>
        </header>

        <div className="booking-confirm-grid">
          <article className="booking-selected-card">
            <figure className="booking-selected-media">
              <img
                src={roomImage}
                alt={roomName}
                onError={(event) => {
                  event.currentTarget.src = hotelImage;
                }}
              />
            </figure>

            <div className="booking-selected-body">
              <h2>{roomName}</h2>
              <p className="booking-selected-subtitle">
                <i className="fa-solid fa-bed" aria-hidden="true"></i>
                Master sea-view suite
              </p>
            </div>
          </article>

          <aside className="booking-summary-card">
            <h2>Reservation Summary</h2>

            <div className="booking-edit-grid">
              <label htmlFor="booking-check-in">
                Check-in
                <input
                  id="booking-check-in"
                  type="date"
                  min={todayDate}
                  value={checkInDate}
                  onChange={handleCheckInChange}
                />
              </label>
              <label htmlFor="booking-check-out">
                Check-out
                <input
                  id="booking-check-out"
                  type="date"
                  min={checkInDate || todayDate}
                  value={checkOutDate}
                  onChange={handleCheckOutChange}
                />
              </label>
              <label htmlFor="booking-guests">
                Guests
                <input
                  id="booking-guests"
                  type="number"
                  min="1"
                  max={Math.max(10, Number(room?.capacity) || 2)}
                  value={guestCount}
                  onChange={(event) =>
                    setGuestCount(
                      normalizeGuestCount(event.target.value, room?.capacity),
                    )
                  }
                />
              </label>
              <label htmlFor="booking-room-count">
                Rooms
                <input
                  id="booking-room-count"
                  type="number"
                  min="1"
                  max="10"
                  value={roomCount}
                  onChange={(event) =>
                    setRoomCount(normalizeRoomCount(event.target.value))
                  }
                />
              </label>
            </div>

            <div className="booking-price-line">
              <span>
                Room ({nights} {nights > 1 ? "nights" : "night"} x{" "}
                {formatCurrency(nightlyRate)} x {roomCount} room)
              </span>
              <strong>{formatCurrency(subTotal)}</strong>
            </div>
            <div className="booking-price-line">
              <span>Taxes & city fees</span>
              <strong>{formatCurrency(taxesAndFees)}</strong>
            </div>
            <div className="booking-price-line">
              <span>Service charge</span>
              <strong>{formatCurrency(serviceCharge)}</strong>
            </div>

            <div className="booking-total-line">
              <span>Total reservation cost</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            <button type="button" className="booking-confirm-btn">
              Xác nhận đặt phòng <i className="fa-solid fa-arrow-right"></i>
            </button>
            <p className="booking-summary-note">
              By confirming, you agree to our terms of service.
            </p>
          </aside>
        </div>

        <div className="booking-highlight-grid">
          <article className="booking-highlight-card">
            <span className="booking-highlight-icon">
              <i
                className="fa-regular fa-calendar-check"
                aria-hidden="true"
              ></i>
            </span>
            <div>
              <h3>Free cancellation</h3>
              <p>Cancel up to 48 hours before check-in for a full refund.</p>
            </div>
          </article>

          <article className="booking-highlight-card">
            <span className="booking-highlight-icon">
              <i className="fa-solid fa-concierge-bell" aria-hidden="true"></i>
            </span>
            <div>
              <h3>24/7 concierge</h3>
              <p>
                Our digital and on-site staff are ready to assist you anytime.
              </p>
            </div>
          </article>

          <article className="booking-highlight-card booking-highlight-card--safe">
            <span className="booking-highlight-icon">
              <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
            </span>
            <div>
              <h3>Safe booking</h3>
              <p>
                Your transaction is protected by encryption and our guest
                satisfaction guarantee.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default Booking_Confirm;
