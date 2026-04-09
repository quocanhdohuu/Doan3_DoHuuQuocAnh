import React, { useEffect, useMemo, useState } from "react";
import "../style/Baocao.css";
import { FeatureHeader } from "./Common";

const REPORT_API_BASE_URL = "http://localhost:3000/api/report";

const ROOM_OCCUPANCY_BY_MONTH_API_URL = (year, month) =>
  `${REPORT_API_BASE_URL}/room-occupancy-by-month?year=${year}&month=${month}`;
const NET_REVENUE_BY_MONTH_API_URL = (year, month) =>
  `${REPORT_API_BASE_URL}/net-revenue-by-month?year=${year}&month=${month}`;
const GUEST_TYPE_BY_MONTH_API_URL = (year, month) =>
  `${REPORT_API_BASE_URL}/guest-type-by-month?year=${year}&month=${month}`;
const RESERVATION_COUNT_BY_MONTH_API_URL = (year, month) =>
  `${REPORT_API_BASE_URL}/reservation-count-by-month?year=${year}&month=${month}`;

const StatCard = ({ label, value, desc, icon, color }) => (
  <div className="baocao-stat-card">
    <div className="baocao-stat-label">
      {label}{" "}
      <span className="baocao-stat-icon" style={{ color }}>
        {icon}
      </span>
    </div>
    <div className="baocao-stat-value">{value}</div>
    <div className="baocao-stat-desc">{desc}</div>
  </div>
);

const ChartCard = ({ title, placeholder }) => (
  <div className="baocao-chart-card">
    <div className="baocao-chart-title">{title}</div>
    <div className="baocao-chart-placeholder">{placeholder}</div>
  </div>
);

const getCurrentMonthValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const parseMonthValue = (value) => {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;

  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;

  return { year, month };
};

const getNumberFromPayload = (payload, keys) => {
  for (const key of keys) {
    const parsedValue = Number(payload?.[key]);
    if (Number.isFinite(parsedValue)) return parsedValue;
  }
  return 0;
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const defaultStats = {
  occupancyPercent: 0,
  usedRooms: 0,
  totalRooms: 0,
  netRevenue: 0,
  bookedGuests: 0,
  walkinGuests: 0,
  totalGuests: 0,
  reservationCount: 0,
};

const Baocao = () => {
  const [monthValue, setMonthValue] = useState(getCurrentMonthValue);
  const [stats, setStats] = useState(defaultStats);

  const selectedDate = useMemo(() => parseMonthValue(monthValue), [monthValue]);

  useEffect(() => {
    if (!selectedDate) return;

    const { year, month } = selectedDate;
    const abortController = new AbortController();
    const { signal } = abortController;

    const fetchJson = async (url) => {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    };

    const loadStats = async () => {
      try {
        const [
          occupancyPayload,
          netRevenuePayload,
          guestTypePayload,
          reservationCountPayload,
        ] = await Promise.all([
          fetchJson(ROOM_OCCUPANCY_BY_MONTH_API_URL(year, month)),
          fetchJson(NET_REVENUE_BY_MONTH_API_URL(year, month)),
          fetchJson(GUEST_TYPE_BY_MONTH_API_URL(year, month)),
          fetchJson(RESERVATION_COUNT_BY_MONTH_API_URL(year, month)),
        ]);

        if (signal.aborted) return;

        setStats({
          occupancyPercent: getNumberFromPayload(occupancyPayload, [
            "Công suất (%)",
            "Cong suat (%)",
            "occupancyPercent",
          ]),
          usedRooms: getNumberFromPayload(occupancyPayload, [
            "Số phòng đã sử dụng",
            "So phong da su dung",
            "usedRooms",
          ]),
          totalRooms: getNumberFromPayload(occupancyPayload, [
            "Tổng số phòng",
            "Tong so phong",
            "totalRooms",
          ]),
          netRevenue: getNumberFromPayload(netRevenuePayload, [
            "Thu nhập sau thuế",
            "Thu nhap sau thue",
            "netRevenue",
          ]),
          bookedGuests: getNumberFromPayload(guestTypePayload, [
            "Khách đặt trước",
            "Khach dat truoc",
            "bookedGuests",
          ]),
          walkinGuests: getNumberFromPayload(guestTypePayload, [
            "Khách walk-in",
            "Khach walk-in",
            "walkinGuests",
          ]),
          totalGuests: getNumberFromPayload(guestTypePayload, [
            "Tổng lượt khách",
            "Tong luot khach",
            "totalGuests",
          ]),
          reservationCount: getNumberFromPayload(reservationCountPayload, [
            "Số lượng đặt phòng",
            "So luong dat phong",
            "reservationCount",
          ]),
        });
      } catch {
        if (!signal.aborted) {
          setStats(defaultStats);
        }
      }
    };

    loadStats();

    return () => {
      abortController.abort();
    };
  }, [selectedDate]);

  const selectedMonthText = selectedDate?.month ?? 0;
  const selectedYearText = selectedDate?.year ?? 0;

  return (
    <div className="baocao-page">
      <div className="baocao-header-row">
        <FeatureHeader
          title="Báo cáo Thống kê"
          description="Xem báo cáo công suất phòng và doanh thu"
        />
        <div className="baocao-month-picker">
          <label>Chọn tháng</label>
          <input
            type="month"
            value={monthValue}
            onChange={(e) => setMonthValue(e.target.value)}
          />
        </div>
      </div>

      <div className="baocao-stats-row">
        <StatCard
          label="Công suất phòng"
          value={`${stats.occupancyPercent}%`}
          desc={`${stats.usedRooms}/${stats.totalRooms} phòng đã sử dụng`}
          icon="%"
          color="#2563eb"
        />
        <StatCard
          label="Doanh thu"
          value={formatCurrency(stats.netRevenue)}
          desc={`Tháng ${selectedMonthText} năm ${selectedYearText}`}
          icon="$"
          color="#22c55e"
        />
        <StatCard
          label="Lưu trú"
          value={stats.totalGuests}
          desc={`${stats.bookedGuests} đặt trước, ${stats.walkinGuests} walk-in`}
          icon={<i className="fa-solid fa-users" />}
          color="#a855f7"
        />
        <StatCard
          label="Đặt phòng"
          value={stats.reservationCount}
          desc={`Đặt phòng trong tháng ${selectedMonthText}`}
          icon={<i className="fa-solid fa-calendar-days" />}
          color="#f97316"
        />
      </div>

      <div className="baocao-charts-row">
        <ChartCard
          title="Doanh thu theo ngày"
          placeholder="[Biểu đồ doanh thu theo ngày]"
        />
        <ChartCard
          title="Doanh thu theo kênh"
          placeholder="[Biểu đồ doanh thu theo kênh]"
        />
      </div>
      <div className="baocao-charts-row">
        <ChartCard
          title="Doanh thu theo loại phòng"
          placeholder="[Biểu đồ doanh thu theo loại phòng]"
        />
        <ChartCard
          title="Công suất theo loại phòng"
          placeholder="[Biểu đồ công suất theo loại phòng]"
        />
      </div>
    </div>
  );
};

export default Baocao;
