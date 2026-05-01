import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";
import { DEFAULT_ROOM_IMAGE, normalizeRoomImageUrl } from "./RoomImageUtils";
import "../../style/Customer_main.css";

const RESERVATIONS_API_BASE_URL = "http://localhost:3000/api/customers";
const PAGE_SIZE = 4;
const ALLOWED_STATUSES = ["BOOKED", "CANCELLED", "CHECKED_IN", "COMPLETED"];

const FILTER_OPTIONS = [
  { key: "ALL", label: "All Stays" },
  { key: "BOOKED", label: "Booked" },
  { key: "CHECKED_IN", label: "Checked In" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Canceled" },
];

const STATUS_META = {
  BOOKED: {
    label: "Confirmed",
    className: "customer-exp-status--booked",
    note: "Manage booking",
  },
  CHECKED_IN: {
    label: "Checked In",
    className: "customer-exp-status--checked-in",
    note: "Enjoy your stay",
  },
  COMPLETED: {
    label: "Completed",
    className: "customer-exp-status--completed",
    note: "Download invoice",
  },
  CANCELLED: {
    label: "Canceled",
    className: "customer-exp-status--cancelled",
    note: "Refund policy",
  },
};

const resolveUserId = (user) => {
  const candidates = [
    user?.userId,
    user?.UserID,
    user?.id,
    user?.ID,
    user?.account?.UserID,
  ];

  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const toDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateShort = (value) => {
  const parsed = toDateValue(value);
  if (!parsed) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
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

const normalizeReservation = (item, index) => {
  const status = String(item?.Status || item?.status || "")
    .trim()
    .toUpperCase();

  const reservationId = item?.ReservationID ?? item?.reservationId ?? index + 1;
  const stayId = item?.StayID ?? item?.stayId ?? null;
  const checkIn = item?.CheckIn ?? item?.CheckInDate ?? item?.checkIn ?? null;
  const checkOut =
    item?.CheckOut ?? item?.CheckOutDate ?? item?.checkOut ?? null;
  const quantity = Number(item?.Quantity ?? item?.NumRooms ?? 1);
  const guests = Number(item?.NumPeople ?? item?.Guests ?? 1);
  const totalAmount = Number(item?.TotalAmount ?? item?.totalAmount ?? 0);
  const imageUrl =
    normalizeRoomImageUrl(
      item?.ImageUrl ??
        item?.ImageURL ??
        item?.Image ??
        item?.RoomImageUrl ??
        item?.RoomImageURL ??
        "",
    ) || DEFAULT_ROOM_IMAGE;

  return {
    id: `${reservationId}-${stayId ?? index}`,
    reservationId,
    stayId,
    status,
    checkIn,
    checkOut,
    roomType:
      item?.RoomType ??
      item?.RoomName ??
      item?.RoomTypeName ??
      `Room ${item?.RoomTypeID ?? ""}`.trim(),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    guests: Number.isFinite(guests) && guests > 0 ? guests : 1,
    totalAmount:
      Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : 0,
    imageUrl,
    sortTime: toDateValue(checkIn)?.getTime() ?? 0,
  };
};

const matchesFilter = (reservation, filterKey) => {
  if (filterKey === "ALL") {
    return ALLOWED_STATUSES.includes(reservation.status);
  }
  return ALLOWED_STATUSES.includes(filterKey) && reservation.status === filterKey;
};

function CustomerExperienceContent() {
  const { user } = useAuth();
  const userId = useMemo(() => resolveUserId(user), [user]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const controller = new AbortController();

    const loadReservations = async () => {
      if (!userId) {
        setReservations([]);
        setError("Không tìm thấy userID khách hàng. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${RESERVATIONS_API_BASE_URL}/${userId}/reservations`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const payload = await response.json();
        const rawItems = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        const normalized = rawItems
          .map((item, index) => normalizeReservation(item, index))
          .filter((entry) => ALLOWED_STATUSES.includes(entry.status))
          .sort((a, b) => b.sortTime - a.sortTime);

        setReservations(normalized);
      } catch (err) {
        if (err.name !== "AbortError") {
          setReservations([]);
          setError(err?.message || "Không thể tải lịch sử đặt phòng.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
    return () => controller.abort();
  }, [userId]);

  const filteredReservations = useMemo(
    () =>
      reservations.filter((reservation) =>
        matchesFilter(reservation, activeFilter),
      ),
    [reservations, activeFilter],
  );

  const visibleReservations = useMemo(
    () => filteredReservations.slice(0, visibleCount),
    [filteredReservations, visibleCount],
  );

  const hasMore = visibleCount < filteredReservations.length;

  const handleFilterChange = (nextFilter) => {
    setActiveFilter(nextFilter);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <main className="customer-main-content customer-experience-content">
      <section className="customer-experience-section">
        <header className="customer-experience-head">
          <p className="customer-section-label">Lịch sử đặt phòng</p>
          <h2>Hành trình của bạn</h2>
          <p className="customer-experience-intro">
            Lịch sử lưu trú được chọn lọc của bạn tại tất cả các khách sạn trong
            hệ thống của chúng tôi. Quản lý các lượt đến sắp tới và xem lại
            những kỷ niệm trong quá khứ.
          </p>
        </header>

        <div
          className="customer-exp-filter-row"
          role="tablist"
          aria-label="Stay filters"
        >
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`customer-exp-filter-btn ${activeFilter === filter.key ? "active" : ""}`}
              onClick={() => handleFilterChange(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="customer-status-box">
            Đang tải reservations của khách hàng...
          </div>
        )}

        {!loading && error && (
          <div className="customer-status-box customer-status-box--error">
            {error}
          </div>
        )}

        {!loading && !error && filteredReservations.length === 0 && (
          <div className="customer-status-box">
            Không có reservation nào thuộc các trạng thái BOOKED, CHECKED_IN,
            COMPLETED, CANCELLED.
          </div>
        )}

        {!loading && !error && filteredReservations.length > 0 && (
          <>
            <div className="customer-exp-grid">
              {visibleReservations.map((item) => {
                const statusMeta =
                  STATUS_META[item.status] || STATUS_META.BOOKED;

                return (
                  <article key={item.id} className="customer-exp-card">
                    <div className={`customer-exp-image ${statusMeta.className}`}>
                      <img
                        src={item.imageUrl || DEFAULT_ROOM_IMAGE}
                        alt={item.roomType || "Room image"}
                        onError={(event) => {
                          event.currentTarget.src = DEFAULT_ROOM_IMAGE;
                        }}
                      />
                    </div>

                    <div className="customer-exp-body">
                      <div className="customer-exp-top">
                        <span
                          className={`customer-exp-status ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                        <span className="customer-exp-id">
                          Reservation {item.reservationId}
                        </span>
                      </div>

                      <h3>{item.roomType}</h3>

                      <p className="customer-exp-date">
                        <i
                          className="fa-regular fa-calendar"
                          aria-hidden="true"
                        ></i>
                        {formatDateShort(item.checkIn)} -{" "}
                        {formatDateShort(item.checkOut)}
                      </p>

                      <p className="customer-exp-meta">
                        {item.quantity} room{item.quantity > 1 ? "s" : ""} | {item.guests} guest
                        {item.guests > 1 ? "s" : ""}
                      </p>

                      <div className="customer-exp-footer">
                        <span>{statusMeta.note}</span>
                        <strong>{formatCurrency(item.totalAmount)}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore && (
              <div className="customer-exp-action-wrap">
                <button
                  type="button"
                  className="customer-exp-load-more"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                >
                  Show Older Reservations
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default CustomerExperienceContent;
