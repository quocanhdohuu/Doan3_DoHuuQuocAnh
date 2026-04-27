import React from "react";
import hotelImage from "../../img/hotel_image.png";

const amenityItems = [
  {
    icon: "fa-solid fa-wifi",
    title: "Wi-Fi siêu nhanh",
    detail: "Tốc độ Gigabit cho tất cả các thiết bị của bạn.",
  },
  {
    icon: "fa-regular fa-snowflake",
    title: "Kiểm soát khí hậu",
    detail: "Khu vực nhiệt độ thông minh được cá nhân hóa.",
  },
  {
    icon: "fa-solid fa-tv",
    title: "Giai tri cao cap",
    detail: "Man hinh thong minh 4K UHD voi kha nang truy cap toan cau.",
  },
  {
    icon: "fa-solid fa-mug-hot",
    title: "Bữa sáng",
    detail: "Lựa chọn tự nhiên được giao đến cửa phòng của bạn.",
  },
  {
    icon: "fa-solid fa-bed",
    title: "Đêm mềm mại",
    detail: "Vải cotton cao cấp và bộ gối nệm theo chuẩn resort.",
  },
  {
    icon: "fa-solid fa-wine-glass",
    title: "Mini Bar",
    detail: "Tuyển chọn rượu vang và đồ uống cao cấp tại phòng.",
  },
];

const formatNightlyRate = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "$450";
  if (amount > 5000) {
    return `$${Math.round(amount / 1000).toLocaleString("en-US")}`;
  }
  return `$${Math.round(amount).toLocaleString("en-US")}`;
};

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (inputDate, days) => {
  const base = new Date(`${inputDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    const today = new Date();
    today.setDate(today.getDate() + Math.max(1, days));
    return toInputDate(today);
  }
  base.setDate(base.getDate() + days);
  return toInputDate(base);
};

function Room_Detail({
  room,
  bookingDraft,
  onBack,
  onExploreExperience,
  onBookNow,
}) {
  const roomName = room?.name || "Luxury Single Suite";
  const roomImage = room?.image || hotelImage;
  const occupancy = Math.max(1, Number(room?.capacity) || 2);
  const nightlyRate = formatNightlyRate(room?.price);
  const roomSize =
    occupancy >= 4 ? "760 sq ft" : occupancy === 3 ? "640 sq ft" : "540 sq ft";

  const todayDate = toInputDate(new Date());
  const checkInDate = bookingDraft?.checkInDate || todayDate;
  const rawCheckOutDate = bookingDraft?.checkOutDate || addDays(checkInDate, 1);
  const checkOutDate =
    rawCheckOutDate > checkInDate ? rawCheckOutDate : addDays(checkInDate, 1);
  const guestCount = Math.max(
    1,
    Math.floor(Number(bookingDraft?.guestCount) || occupancy),
  );
  const roomCount = Math.max(1, Math.floor(Number(bookingDraft?.roomCount) || 1));

  const handleBookNow = () => {
    if (typeof onBookNow !== "function") return;
    onBookNow({
      checkInDate,
      checkOutDate,
      guestCount,
      roomCount,
    });
  };

  return (
    <div className="grand-room-page">
      <section className="grand-room-hero">
        <img
          src={roomImage}
          alt={roomName}
          onError={(event) => {
            event.currentTarget.src = hotelImage;
          }}
        />
      </section>

      <main className="grand-room-main">
        <div className="grand-room-actions">
          <button type="button" onClick={onBack}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            Trở về
          </button>
          <button type="button" onClick={onExploreExperience}>
            Trải nghiệm của bạn
          </button>
        </div>

        <section className="grand-room-panel">
          <div className="grand-room-panel-head">
            <div>
              <p className="grand-room-kicker">Thông tin loại phòng</p>
              <h1 className="grand-room-title">{roomName}</h1>
            </div>

            <div className="grand-room-rate">
              <p>Giá bắt đầu</p>
              <strong>{nightlyRate}</strong>
              <span>/ Đêm</span>
            </div>
          </div>

          <div className="grand-room-panel-body">
            <div className="grand-room-amenity-wrap">
              <h2>Tiện nghi và thoải mái</h2>

              <div className="grand-room-amenities">
                {amenityItems.map((item) => (
                  <article key={item.title} className="grand-room-amenity">
                    <span className="grand-room-amenity-icon">
                      <i className={item.icon} aria-hidden="true"></i>
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="grand-room-specs">
              <p>Thông số phòng</p>
              <div className="grand-room-spec-row">
                <span>Kích thước</span>
                <strong>{roomSize}</strong>
              </div>
              <div className="grand-room-spec-row">
                <span>Lưu lượng</span>
                <strong>{occupancy} Người</strong>
              </div>
              <div className="grand-room-spec-row">
                <span>View</span>
                <strong>Bãi biển</strong>
              </div>
            </aside>
          </div>

          <button type="button" className="grand-room-book-btn" onClick={handleBookNow}>
            Đặt phòng ngay
          </button>
        </section>

        <section className="grand-room-story">
          <article className="grand-room-story-media">
            <img src={hotelImage} alt={`${roomName} interior`} />
          </article>

          <article className="grand-room-story-copy">
            <p className="grand-room-kicker">Trải nghiệm</p>
            <h2>Một chốn tĩnh lặng được thiết kế dành cho sự thanh tịnh.</h2>
            <button type="button" onClick={onExploreExperience}>
              Khám phá bộ sưu tập <i className="fa-solid fa-arrow-right"></i>
            </button>
          </article>
        </section>
      </main>
    </div>
  );
}

export default Room_Detail;
