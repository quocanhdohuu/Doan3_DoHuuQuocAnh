import React from "react";
import "../../style/Customer_main.css";
import heroImage from "../../img/hotel_image.png";
import loungeImage from "../../img/deluxe2.png";
import suiteImage from "../../img/vip4.png";
import nightImage from "../../img/single3.png";

const AMENITIES = [
  {
    icon: "fa-solid fa-wifi",
    title: "Wi-Fi miễn phí",
    description: "Tốc độ cao trong toàn bộ khách sạn",
  },
  {
    icon: "fa-solid fa-car",
    title: "Bãi đỗ xe",
    description: "An toàn và tiện lợi",
  },
  {
    icon: "fa-solid fa-utensils",
    title: "Nhà hàng",
    description: "Ẩm thực đa dạng cao cấp",
  },
  {
    icon: "fa-solid fa-mug-hot",
    title: "Bar & Cafe",
    description: "Thức uống hảo hạng 24/7",
  },
  {
    icon: "fa-solid fa-dumbbell",
    title: "Phòng gym",
    description: "Trang thiết bị hiện đại",
  },
  {
    icon: "fa-solid fa-water",
    title: "Bể bơi",
    description: "Hồ bơi vô cực tầng thượng",
  },
  {
    icon: "fa-regular fa-star",
    title: "Spa & Massage",
    description: "Dịch vụ chăm sóc toàn diện",
  },
  {
    icon: "fa-solid fa-building",
    title: "Phòng hội nghị",
    description: "Sự kiện chuyên nghiệp",
  },
];

function CustomerAboutContent() {
  return (
    <main className="customer-main-content customer-about-content">
      <section className="customer-about-hero">
        <article className="customer-about-hero-copy">
          <h2>
            Chào mừng đến với The QA
            <br />
            Hotel
          </h2>

          <p>
            The QA Hotel là điểm đến lý tưởng cho những ai tìm kiếm sự kết hợp
            hoàn hảo giữa sang trọng và tiện nghi. Với vị trí đắc địa tại trung
            tâm thành phố, khách sạn mang đến trải nghiệm nghỉ dưỡng đẳng cấp 5 sao.
          </p>

          <p>
            Được thiết kế với phong cách hiện đại và tinh tế, mỗi phòng nghỉ tại
            The QA Hotel đều được trang bị đầy đủ tiện nghi cao cấp, đảm bảo mang
            đến cho quý khách những giây phút thư giãn tuyệt vời nhất.
          </p>

          <p>
            Đội ngũ nhân viên chuyên nghiệp và tận tâm của chúng tôi luôn sẵn
            sàng phục vụ 24/7, cam kết mang đến cho quý khách trải nghiệm lưu trú
            đáng nhớ và hoàn hảo.
          </p>
        </article>

        <figure className="customer-about-hero-media">
          <img src={heroImage} alt="Không gian sảnh The QA Hotel" />
        </figure>
      </section>

      <section className="customer-about-amenities">
        <header className="customer-about-section-head">
          <h3>Tiện nghi & Dịch vụ</h3>
        </header>

        <div className="customer-about-amenity-grid">
          {AMENITIES.map((amenity) => (
            <article key={amenity.title} className="customer-about-amenity-card">
              <span className="customer-about-amenity-icon" aria-hidden="true">
                <i className={amenity.icon}></i>
              </span>
              <h4>{amenity.title}</h4>
              <p>{amenity.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="customer-about-gallery">
        <header className="customer-about-section-head">
          <h3>Không gian khách sạn</h3>
        </header>

        <div className="customer-about-gallery-grid">
          <figure>
            <img src={loungeImage} alt="Khu vực tiếp đón xanh mát" />
          </figure>
          <figure>
            <img src={suiteImage} alt="Phòng khách sạn với nội thất ấm cúng" />
          </figure>
          <figure>
            <img src={nightImage} alt="Không gian thư giãn về đêm" />
          </figure>
        </div>
      </section>

      <section className="customer-about-contact">
        <h3>Liên hệ đặt phòng</h3>
        <p>
          Hãy liên hệ với chúng tôi để được tư vấn và đặt phòng. Đội ngũ của The
          QA Hotel luôn sẵn sàng phục vụ quý khách.
        </p>

        <div className="customer-about-contact-grid">
          <div>
            <span>Điện thoại</span>
            <strong>+84 123 456 789</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>info@theqahotel.com</strong>
          </div>
          <div>
            <span>Địa chỉ</span>
            <strong>123 Nguyễn Huệ, Q.1, TP.HCM</strong>
          </div>
        </div>

        <button type="button" className="customer-about-book-btn">
          Đặt phòng ngay
        </button>
      </section>
    </main>
  );
}

export default CustomerAboutContent;
