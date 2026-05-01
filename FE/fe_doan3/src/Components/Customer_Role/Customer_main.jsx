import React, { useCallback, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";
import "../../style/Customer_main.css";
import CustomerHomeContent from "./Customer_HomeContent";
import CustomerExperienceContent from "./Customer_ExperienceContent";
import CustomerAboutContent from "./Customer_AboutContent";
import CustomerAccountContent from "./Customer_AccountContent";
import Room_Detail from "./Room_Detail";
import Booking_Confirm from "./Booking_Confirm";
import Experience_Detail from "./Experience_Detail";

const MENU_KEYS = {
  HOME: "home",
  EXPERIENCE: "experience",
  ABOUT: "about",
  ACCOUNT: "account",
  ROOM_DETAIL: "room-detail",
  BOOKING_CONFIRM: "booking-confirm",
  EXPERIENCE_DETAIL: "experience-detail",
};

function Customer_main() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState(MENU_KEYS.HOME);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingDraft, setBookingDraft] = useState(null);
  const [selectedExperience, setSelectedExperience] = useState(null);

  const handleRoomSelect = useCallback((room, bookingContext) => {
    setSelectedRoom(room);
    setBookingDraft(bookingContext || null);
    setActivePage(MENU_KEYS.ROOM_DETAIL);
  }, []);

  const handleBackToRooms = useCallback(() => {
    setActivePage(MENU_KEYS.HOME);
  }, []);

  const handleGoToExperience = useCallback(() => {
    setActivePage(MENU_KEYS.EXPERIENCE);
  }, []);

  const handleExperienceSelect = useCallback((experienceItem) => {
    setSelectedExperience(experienceItem || null);
    setActivePage(MENU_KEYS.EXPERIENCE_DETAIL);
  }, []);

  const handleBackToExperience = useCallback(() => {
    setActivePage(MENU_KEYS.EXPERIENCE);
  }, []);

  const handleRebookFromExperience = useCallback(() => {
    setActivePage(MENU_KEYS.HOME);
  }, []);

  const handleGoToBookingConfirm = useCallback((nextBookingDraft) => {
    if (nextBookingDraft) {
      setBookingDraft((prev) => ({
        ...(prev || {}),
        ...nextBookingDraft,
      }));
    }
    setActivePage(MENU_KEYS.BOOKING_CONFIRM);
  }, []);

  const handleBackToRoomDetail = useCallback(() => {
    setActivePage(MENU_KEYS.ROOM_DETAIL);
  }, []);

  const handleBookingSuccess = useCallback((message) => {
    setSelectedRoom(null);
    setBookingDraft(null);
    setActivePage(MENU_KEYS.HOME);
    window.alert(message || "Đặt phòng thành công.");
  }, []);

  const currentContent = useMemo(() => {
    switch (activePage) {
      case MENU_KEYS.EXPERIENCE:
        return <CustomerExperienceContent onSelectExperience={handleExperienceSelect} />;
      case MENU_KEYS.EXPERIENCE_DETAIL:
        return (
          <Experience_Detail
            experience={selectedExperience}
            onBack={handleBackToExperience}
            onRebook={handleRebookFromExperience}
          />
        );
      case MENU_KEYS.ABOUT:
        return <CustomerAboutContent />;
      case MENU_KEYS.ACCOUNT:
        return <CustomerAccountContent user={user} />;
      case MENU_KEYS.ROOM_DETAIL:
        return (
          <Room_Detail
            room={selectedRoom}
            bookingDraft={bookingDraft}
            onBack={handleBackToRooms}
            onExploreExperience={handleGoToExperience}
            onBookNow={handleGoToBookingConfirm}
          />
        );
      case MENU_KEYS.BOOKING_CONFIRM:
        return (
          <Booking_Confirm
            room={selectedRoom}
            bookingDraft={bookingDraft}
            onBack={handleBackToRoomDetail}
            onBookingDraftChange={setBookingDraft}
            onBookingSuccess={handleBookingSuccess}
          />
        );
      case MENU_KEYS.HOME:
      default:
        return <CustomerHomeContent user={user} onRoomSelect={handleRoomSelect} />;
    }
  }, [
    activePage,
    user,
    selectedRoom,
    bookingDraft,
    handleBackToRooms,
    handleGoToExperience,
    handleExperienceSelect,
    handleBackToExperience,
    handleRebookFromExperience,
    handleGoToBookingConfirm,
    handleBackToRoomDetail,
    handleBookingSuccess,
    handleRoomSelect,
    selectedExperience,
  ]);

  const currentNavPage =
    activePage === MENU_KEYS.ROOM_DETAIL ||
    activePage === MENU_KEYS.BOOKING_CONFIRM
      ? MENU_KEYS.HOME
      : activePage === MENU_KEYS.EXPERIENCE_DETAIL
        ? MENU_KEYS.EXPERIENCE
      : activePage;
  const getNavClassName = (key) =>
    `customer-nav-link ${currentNavPage === key ? "active" : ""}`;

  return (
    <div className="customer-main-page">
      <header className="customer-topbar">
        <div className="customer-brand">The QA Hotel</div>

        <nav className="customer-nav">
          <button
            type="button"
            className={getNavClassName(MENU_KEYS.ABOUT)}
            onClick={() => setActivePage(MENU_KEYS.ABOUT)}
          >
            Về chúng tôi
          </button>
          <button
            type="button"
            className={getNavClassName(MENU_KEYS.HOME)}
            onClick={() => setActivePage(MENU_KEYS.HOME)}
          >
            Đặt phòng
          </button>
          <button
            type="button"
            className={getNavClassName(MENU_KEYS.EXPERIENCE)}
            onClick={() => setActivePage(MENU_KEYS.EXPERIENCE)}
          >
            Trải nghiệm của bạn
          </button>
        </nav>

        <div className="customer-topbar-actions">
          <button
            type="button"
            className="customer-book-now-btn"
            onClick={() => setActivePage(MENU_KEYS.HOME)}
          >
            Đặt ngay
          </button>

          <button
            type="button"
            className={`customer-user-badge ${activePage === MENU_KEYS.ACCOUNT ? "active" : ""}`}
            title={user?.email || "Customer"}
            onClick={() => setActivePage(MENU_KEYS.ACCOUNT)}
          >
            <i className="fa-regular fa-user" aria-hidden="true"></i>
          </button>

          <button
            type="button"
            className="customer-logout-btn"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </header>

      {currentContent}

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
