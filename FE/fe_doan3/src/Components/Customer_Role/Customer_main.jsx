import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";
import "../../style/Customer_main.css";
import hotelImage from "../../img/hotel_image.png";

const ROOM_TYPES_API_URL =
  "http://localhost:3000/api/get-room-types/with-price";
const SEARCH_AVAILABLE_ROOM_TYPES_API_URL =
  "http://localhost:3000/api/get-room-types/search-available";

const normalizeTextKey = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "");

const roomImageAssets = import.meta.glob("../../img/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const roomImageByKey = Object.entries(roomImageAssets).reduce(
  (acc, [path, imageUrl]) => {
    const fileName =
      path
        .split("/")
        .pop()
        ?.replace(/\.[^.]+$/, "") || "";
    const key = normalizeTextKey(fileName);
    if (key) {
      acc[key] = imageUrl;
    }
    return acc;
  },
  {},
);

const excludedImageKeys = new Set(["hotelimage", "test"]);

const resolveRoomTypeImage = (roomTypeName, apiImageUrl) => {
  const normalizedRoomName = normalizeTextKey(roomTypeName);
  const hasDigits = normalizedRoomName.match(/\d+$/);
  const suffixNumber = hasDigits ? hasDigits[0] : "";
  const baseName = suffixNumber
    ? normalizedRoomName.slice(0, -suffixNumber.length)
    : normalizedRoomName;

  const candidateKeys = [
    normalizedRoomName,
    suffixNumber === "1" ? baseName : "",
    baseName,
  ].filter(Boolean);

  for (const key of candidateKeys) {
    if (roomImageByKey[key]) {
      return roomImageByKey[key];
    }
  }

  const fuzzyMatch = Object.entries(roomImageByKey).find(
    ([key]) =>
      !excludedImageKeys.has(key) &&
      (normalizedRoomName.includes(key) ||
        (baseName && key.includes(baseName)) ||
        (baseName && baseName.includes(key))),
  );

  if (fuzzyMatch) {
    return fuzzyMatch[1];
  }

  if (apiImageUrl) {
    return apiImageUrl;
  }

  return hotelImage;
};

const normalizeRoomType = (item, index) => {
  const rawAvailableRooms = item?.AvailableRooms ?? item?.availableRooms;
  const availableRoomsNumber = Number(rawAvailableRooms);
  const apiImageUrl = item?.ImageURL ?? item?.Image ?? item?.thumbnail ?? "";
  const name = item?.Name ?? item?.name ?? `Room Type ${index + 1}`;

  return {
    id: item?.RoomTypeID ?? item?.id ?? `room-${index}`,
    name,
    description:
      item?.Description ??
      item?.description ??
      "Thoughtfully curated comfort for discerning travelers.",
    capacity: Number(item?.Capacity ?? item?.capacity ?? 2),
    price: Number(item?.Price ?? item?.DefaultPrice ?? item?.price ?? 0),
    image: resolveRoomTypeImage(name, apiImageUrl),
    availableRooms: Number.isFinite(availableRoomsNumber)
      ? availableRoomsNumber
      : null,
  };
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Contact us";
  return `${amount.toLocaleString("vi-VN")} VND`;
};

function Customer_main() {
  const { user, logout } = useAuth();
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    const controller = new AbortController();

    const loadRoomTypes = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(ROOM_TYPES_API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const payload = await response.json();
        const rawItems = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        const rooms = rawItems.map((item, index) =>
          normalizeRoomType(item, index),
        );
        setRoomTypes(rooms);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Khong the tai danh sach loai phong.");
          setRoomTypes([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadRoomTypes();

    return () => controller.abort();
  }, []);

  const featuredRooms = useMemo(() => roomTypes, [roomTypes]);
  const displayName = user?.name?.trim() || "Guest";
  const checkOutMinDate = checkInDate || minDate;

  const handleCheckInChange = (event) => {
    const value = event.target.value;
    setCheckInDate(value);

    if (checkOutDate && value && checkOutDate < value) {
      setCheckOutDate(value);
    }
  };

  const handleQuantityChange = (setter) => (event) => {
    const next = Number(event.target.value);
    if (!Number.isFinite(next)) return;
    setter(Math.max(1, Math.floor(next)));
  };

  const handleSearchAvailableRooms = async () => {
    if (!checkInDate || !checkOutDate) {
      setError("Vui long chon ngay nhan va ngay tra phong de tim kiem.");
      return;
    }

    if (checkOutDate < checkInDate) {
      setError("Ngay tra phong phai sau hoac bang ngay nhan phong.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(SEARCH_AVAILABLE_ROOM_TYPES_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          CheckInDate: checkInDate,
          CheckOutDate: checkOutDate,
          NumPeople: Number(guestCount),
          NumRooms: Number(roomCount),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const payload = await response.json();
      const rawItems = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      const rooms = rawItems.map((item, index) =>
        normalizeRoomType(item, index),
      );

      setRoomTypes(rooms);
    } catch (err) {
      setError(err.message || "Không thể tìm phòng trong thời gian đã chọn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-main-page">
      <header className="customer-topbar">
        <div className="customer-brand">The QA Hotel</div>

        <nav className="customer-nav">
          <a href="#rooms" className="active">
            Trang Chủ
          </a>
          <a href="#experience">Trải nghiện của bạn</a>
          <a href="#about">Về chúng tôi</a>
        </nav>

        <div className="customer-topbar-actions">
          <button type="button" className="customer-book-now-btn">
            Đặt ngay
          </button>

          <div
            className="customer-user-badge"
            title={user?.email || "Customer"}
          >
            <i className="fa-regular fa-user" aria-hidden="true"></i>
          </div>

          <button
            type="button"
            className="customer-logout-btn"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </header>

      <section className="customer-hero" id="experience">
        <img
          className="customer-hero-image"
          src={hotelImage}
          alt="Hotel lobby with warm luxury design"
        />
        <div className="customer-hero-overlay" />

        <div className="customer-hero-content">
          <p className="customer-kicker">VẺ ĐẸP THANH LỊCH</p>
          <h1>
            Chốn nghỉ dưỡng riêng của bạn
            <br />
            xa rời mọi ồn ào
          </h1>
          <p className="customer-hero-subtitle">
            Chào mừng {displayName} quay trở lại. Khám phá những không gian lưu
            trú tinh tuyển, nơi sự tiện nghi, riêng tư và dịch vụ đẳng cấp vượt
            thời gian được đặt lên hàng đầu.
          </p>

          <div className="customer-search-bar" aria-label="Booking search form">
            <div className="customer-search-item customer-search-item--input">
              <label htmlFor="customer-check-in">Ngày nhận</label>
              <input
                id="customer-check-in"
                type="date"
                className="customer-search-input customer-search-input--date"
                min={minDate}
                value={checkInDate}
                onChange={handleCheckInChange}
              />
            </div>
            <div className="customer-search-item customer-search-item--input">
              <label htmlFor="customer-check-out">Ngày trả</label>
              <input
                id="customer-check-out"
                type="date"
                className="customer-search-input customer-search-input--date"
                min={checkOutMinDate}
                value={checkOutDate}
                onChange={(event) => setCheckOutDate(event.target.value)}
              />
            </div>
            <div className="customer-search-item customer-search-item--input">
              <label htmlFor="customer-guests">Số khách</label>
              <div className="customer-search-quantity">
                <input
                  id="customer-guests"
                  type="number"
                  min="1"
                  className="customer-search-input customer-search-input--quantity"
                  value={guestCount}
                  onChange={handleQuantityChange(setGuestCount)}
                />
              </div>
            </div>
            <div className="customer-search-item customer-search-item--input">
              <label htmlFor="customer-rooms">Số lượng phòng</label>
              <div className="customer-search-quantity">
                <input
                  id="customer-rooms"
                  type="number"
                  min="1"
                  className="customer-search-input customer-search-input--quantity"
                  value={roomCount}
                  onChange={handleQuantityChange(setRoomCount)}
                />
              </div>
            </div>
            <button
              type="button"
              className="customer-search-btn"
              aria-label="Search room"
              onClick={handleSearchAvailableRooms}
              disabled={loading}
            >
              <i
                className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-magnifying-glass"}`}
              ></i>
            </button>
          </div>
        </div>
      </section>

      <main className="customer-main-content">
        <section className="customer-featured" id="rooms">
          <div className="customer-section-head">
            <div>
              <p className="customer-section-label">Tuyển chọn</p>
              <h2>Những nơi lưu trú nổi bật</h2>
            </div>
            <button type="button" className="customer-link-btn">
              Xem tất cả các loại phòng
            </button>
          </div>

          {loading && (
            <div className="customer-status-box">
              Dang tai danh sach loai phong...
            </div>
          )}

          {!loading && error && (
            <div className="customer-status-box customer-status-box--error">
              Khong the tai du lieu phong: {error}
            </div>
          )}

          {!loading && !error && featuredRooms.length === 0 && (
            <div className="customer-status-box">
              Chua co loai phong nao de hien thi. Vui long thu lai sau.
            </div>
          )}

          {!loading && !error && featuredRooms.length > 0 && (
            <div className="customer-room-grid">
              {featuredRooms.map((room) => (
                <article className="customer-room-card" key={room.id}>
                  <div className="customer-room-media">
                    <img
                      src={room.image || hotelImage}
                      alt={room.name}
                      onError={(event) => {
                        event.currentTarget.src = hotelImage;
                      }}
                    />
                  </div>

                  <div className="customer-room-body">
                    <h3>{room.name}</h3>
                    <p>{room.description}</p>

                    <div className="customer-room-meta">
                      <div>
                        <small>From</small>
                        <strong>{formatCurrency(room.price)}</strong>
                        <span>/ night</span>
                      </div>
                      <button type="button" aria-label={`Explore ${room.name}`}>
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>

                    <span className="customer-capacity">
                      {room.capacity || 2} guests
                    </span>
                    {room.availableRooms !== null && (
                      <span className="customer-capacity customer-capacity--availability">
                        {room.availableRooms} rooms available
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="customer-philosophy" id="amenities">
          <div className="customer-philosophy-visual">
            <img src={hotelImage} alt="Luxury in-room amenities" />
            <div className="customer-concierge-card">
              <img src={hotelImage} alt="Personal concierge" />
            </div>
          </div>

          <div className="customer-philosophy-content">
            <p className="customer-section-label">TRIẾT LÝ CỦA CHÚNG TÔI</p>
            <h2>Di sản của sự sang trọng tinh tế, kín đáo</h2>
            <p className="customer-quote">
              “Xa xỉ đích thực không nằm ở sự phô trương, mà ở khả năng thấu
              hiểu và đáp ứng mọi nhu cầu trước khi bạn cất lời.”
            </p>
            <p>
              Tọa lạc tại giao điểm giữa giá trị di sản và hơi thở hiện đại, The
              QA Hotel mang đến nhiều hơn một kỳ nghỉ. Đó là lời mời bạn thả
              lỏng và tận hưởng những không gian nơi thời gian dường như chậm
              lại, và từng chi tiết đều được chăm chút riêng cho bạn.
            </p>

            <div className="customer-feature-points">
              <div>
                <h4>Ẩm thực thiết kế riêng</h4>
                <p>
                  Thực đơn do đầu bếp tuyển chọn, tinh chỉnh theo mùa và khẩu vị
                  của bạn.
                </p>
              </div>
              <div>
                <h4>Spa toàn diện</h4>
                <p>
                  Các liệu pháp đặc trưng lấy cảm hứng từ khoa học chăm sóc sức
                  khỏe hiện đại.
                </p>
              </div>
            </div>

            <button type="button" className="customer-primary-btn">
              Khám phá tiện ích
            </button>
          </div>
        </section>

        <section className="customer-promo" id="about">
          <div className="customer-promo-left">
            <p className="customer-section-label">LIMITED TIME</p>
            <h2>KỲ NGHỈ GIỜ HOÀNG HÔN</h2>
            <p>
              Đặt tối thiểu 3 đêm và nhận ưu đãi đưa đón sân bay miễn phí cùng
              tiệc champagne ngắm hoàng hôn tại sân thượng của chúng tôi.
            </p>
            <div className="customer-promo-actions">
              <button type="button" className="customer-claim-btn">
                Nhận ưu đãi
              </button>
              <button type="button" className="customer-detail-btn">
                Chi tiết
              </button>
            </div>
          </div>

          <div className="customer-promo-right">
            <div className="customer-discount-box">
              <span>ƯU ĐÃI ĐẶC BIỆT</span>
              <strong>15% OFF</strong>
              <p>Áp dụng cho tất cả hạng phòng VIP trong mùa này</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="customer-footer">
        <div className="customer-footer-brand">The QA Hotel</div>
        <div className="customer-footer-links">
          <span>CHÍNH SÁCH BẢO MẬT</span>
          <span>ĐIỀU KHOẢN DỊCH VỤ</span>
          <span>LIÊN HỆ</span>
          <span>TUYỂN DỤNG</span>
          <span>BỘ TÀI LIỆU BÁO CHÍ</span>
        </div>
        <div className="customer-footer-copy">
          © 2026 THE QA HOTEL. BẢO LƯU MỌI QUYỀN.
        </div>
      </footer>
    </div>
  );
}

export default Customer_main;
