import React, { useEffect, useMemo, useState } from "react";
import "../style/Baocao.css";
import { FeatureHeader } from "./Common";

const REPORT_API_BASE_URL = "http://localhost:3000/api/report";
const REPORTS_API_BASE_URL = "http://localhost:3000/api/reports";

const ROOM_OCCUPANCY_BY_MONTH_API_URL = (year, month) =>
  `${REPORT_API_BASE_URL}/room-occupancy-by-month?year=${year}&month=${month}`;
const NET_REVENUE_BY_MONTH_API_URL = (year, month) =>
  `${REPORT_API_BASE_URL}/net-revenue-by-month?year=${year}&month=${month}`;
const GUEST_TYPE_BY_MONTH_API_URL = (year, month) =>
  `${REPORT_API_BASE_URL}/guest-type-by-month?year=${year}&month=${month}`;
const RESERVATION_COUNT_BY_MONTH_API_URL = (year, month) =>
  `${REPORT_API_BASE_URL}/reservation-count-by-month?year=${year}&month=${month}`;

const REVENUE_BY_DAY_IN_MONTH_API_URL = (year, month) =>
  `${REPORTS_API_BASE_URL}/revenue-by-day-in-month?month=${month}&year=${year}`;
const REVENUE_BY_ROOM_TYPE_IN_MONTH_API_URL = (year, month) =>
  `${REPORTS_API_BASE_URL}/revenue-by-room-type-in-month?month=${month}&year=${year}`;
const ROOM_TYPE_USAGE_PERCENT_IN_MONTH_API_URL = (year, month) =>
  `${REPORTS_API_BASE_URL}/room-type-usage-percent-in-month?month=${month}&year=${year}`;
const REVENUE_BY_CUSTOMER_TYPE_API_URL = (year, month) =>
  `${REPORTS_API_BASE_URL}/revenue-by-customer-type?month=${month}&year=${year}`;

const CHART_COLORS = [
  "#2563eb",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#f59e0b",
  "#6366f1",
];

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

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getNumberFromPayload = (payload, keys) => {
  for (const key of keys) {
    const parsedValue = Number(payload?.[key]);
    if (Number.isFinite(parsedValue)) return parsedValue;
  }
  return 0;
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const formatCompactNumber = (value) => {
  const numeric = Number(value) || 0;
  const abs = Math.abs(numeric);
  if (abs >= 1_000_000_000) return `${(numeric / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(numeric / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(numeric / 1_000).toFixed(1)}K`;
  return numeric.toLocaleString("vi-VN");
};

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const mapRevenueByDay = (rawItems) =>
  rawItems
    .map((item) => ({
      day: getNumberFromPayload(item, ["Ngay", "Day", "day"]),
      value: getNumberFromPayload(item, [
        "DoanhThu",
        "Revenue",
        "TotalRevenue",
        "revenue",
      ]),
    }))
    .filter((item) => item.day > 0)
    .sort((a, b) => a.day - b.day)
    .map((item) => ({
      key: `day-${item.day}`,
      label: String(item.day),
      value: item.value,
    }));

const mapRevenueByRoomType = (rawItems) =>
  rawItems
    .map((item, index) => ({
      key: `room-type-${index}`,
      label: String(
        item?.TenLoaiPhong ??
          item?.RoomTypeName ??
          item?.RoomType ??
          item?.roomType ??
          "Khác",
      ),
      value: getNumberFromPayload(item, ["DoanhThu", "Revenue", "revenue"]),
    }))
    .sort((a, b) => b.value - a.value);

const mapRoomTypeUsagePercent = (rawItems) =>
  rawItems
    .map((item, index) => ({
      key: `usage-${index}`,
      label: String(
        item?.TenLoaiPhong ??
          item?.RoomTypeName ??
          item?.RoomType ??
          item?.roomType ??
          "Khác",
      ),
      value: getNumberFromPayload(item, [
        "PhanTramSuDung",
        "UsagePercent",
        "Percentage",
      ]),
    }))
    .sort((a, b) => b.value - a.value);

const mapRevenueByCustomerType = (rawItems) =>
  rawItems.map((item, index) => ({
    key: `customer-type-${index}`,
    label: String(
      item?.CustomerType ??
        item?.LoaiKhach ??
        item?.Channel ??
        item?.customerType ??
        "Khác",
    ),
    value: getNumberFromPayload(item, [
      "TotalRevenue",
      "DoanhThu",
      "Revenue",
      "revenue",
    ]),
  }));

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

const ChartCard = ({ title, children }) => (
  <div className="baocao-chart-card">
    <div className="baocao-chart-title">{title}</div>
    {children}
  </div>
);

const ChartPlaceholder = ({ text }) => (
  <div className="baocao-chart-placeholder">{text}</div>
);

const BarChartPanel = ({
  data,
  color = "#2563eb",
  emptyText = "Không có dữ liệu.",
}) => {
  if (!data.length) return <ChartPlaceholder text={emptyText} />;

  const maxValue = Math.max(...data.map((item) => item.value), 0);
  const safeMax = maxValue > 0 ? maxValue : 1;
  const labelStep = data.length > 16 ? 2 : 1;

  return (
    <div className="baocao-bar-scroll">
      <div className="baocao-bar-chart">
        {data.map((item, index) => {
          const heightPercent =
            item.value > 0 ? Math.max((item.value / safeMax) * 100, 3) : 0;
          const showLabel =
            index % labelStep === 0 || index === data.length - 1;

          return (
            <div className="baocao-bar-item" key={item.key ?? item.label}>
              <div
                className="baocao-bar-item-top"
                title={formatCurrency(item.value)}
              >
                {item.value > 0 ? formatCompactNumber(item.value) : ""}
              </div>
              <div className="baocao-bar-item-track">
                <div
                  className="baocao-bar-item-fill"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <div className="baocao-bar-item-label" title={item.label}>
                {showLabel ? item.label : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PieChartPanel = ({
  data,
  valueFormatter = formatCurrency,
  percentMode = "share",
  showTotal = false,
  totalLabel = "Tổng doanh thu",
  emptyText = "Không có dữ liệu.",
}) => {
  if (!data.length) return <ChartPlaceholder text={emptyText} />;

  const withColor = data.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
    safeValue: Math.max(0, Number(item.value) || 0),
  }));

  const total = withColor.reduce((sum, item) => sum + item.safeValue, 0);
  const positiveData = withColor.filter((item) => item.safeValue > 0);
  if (total <= 0 || positiveData.length === 0) {
    return <ChartPlaceholder text={emptyText} />;
  }

  const segments = positiveData.reduce(
    (acc, item, index) => {
      const isLast = index === positiveData.length - 1;
      const partPercent = (item.safeValue / total) * 100;
      const start = acc.runningPercent;
      const end = isLast ? 100 : start + partPercent;

      return {
        runningPercent: end,
        items: [...acc.items, { ...item, start, end }],
      };
    },
    { runningPercent: 0, items: [] },
  ).items;

  const gradient = segments
    .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
    .join(", ");

  return (
    <div className={`baocao-pie-layout ${showTotal ? "with-total" : ""}`}>
      <div className="baocao-pie-visual">
        <div
          className="baocao-pie-chart"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="baocao-pie-hole" />
        </div>
      </div>

      <div className="baocao-pie-legend">
        {withColor.map((item) => {
          const percent =
            percentMode === "value"
              ? item.safeValue
              : (item.safeValue / total) * 100;

          return (
            <div
              className="baocao-pie-legend-item"
              key={item.key ?? item.label}
            >
              <span
                className="baocao-pie-dot"
                style={{ backgroundColor: item.color }}
              />
              <span className="baocao-pie-label">{item.label}</span>
              <span className="baocao-pie-value">
                {valueFormatter(item.safeValue)}
              </span>
              <span className="baocao-pie-percent">
                {formatPercent(percent)}
              </span>
            </div>
          );
        })}
      </div>

      {showTotal && (
        <div className="baocao-pie-total">
          <div className="baocao-pie-total-label">{totalLabel}</div>
          <div className="baocao-pie-total-value">{formatCurrency(total)}</div>
        </div>
      )}
    </div>
  );
};

const Baocao = () => {
  const [monthValue, setMonthValue] = useState(getCurrentMonthValue);
  const [stats, setStats] = useState(defaultStats);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState("");
  const [revenueByDay, setRevenueByDay] = useState([]);
  const [revenueByRoomType, setRevenueByRoomType] = useState([]);
  const [roomTypeUsagePercent, setRoomTypeUsagePercent] = useState([]);
  const [revenueByCustomerType, setRevenueByCustomerType] = useState([]);

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
        if (!signal.aborted) setStats(defaultStats);
      }
    };

    loadStats();
    return () => abortController.abort();
  }, [selectedDate]);

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

    const loadCharts = async () => {
      try {
        setChartsLoading(true);
        setChartsError("");

        const [
          revenueByDayPayload,
          revenueByRoomTypePayload,
          roomTypeUsagePayload,
          revenueByCustomerTypePayload,
        ] = await Promise.all([
          fetchJson(REVENUE_BY_DAY_IN_MONTH_API_URL(year, month)),
          fetchJson(REVENUE_BY_ROOM_TYPE_IN_MONTH_API_URL(year, month)),
          fetchJson(ROOM_TYPE_USAGE_PERCENT_IN_MONTH_API_URL(year, month)),
          fetchJson(REVENUE_BY_CUSTOMER_TYPE_API_URL(year, month)),
        ]);

        if (signal.aborted) return;

        setRevenueByDay(mapRevenueByDay(extractList(revenueByDayPayload)));
        setRevenueByRoomType(
          mapRevenueByRoomType(extractList(revenueByRoomTypePayload)),
        );
        setRoomTypeUsagePercent(
          mapRoomTypeUsagePercent(extractList(roomTypeUsagePayload)),
        );
        setRevenueByCustomerType(
          mapRevenueByCustomerType(extractList(revenueByCustomerTypePayload)),
        );
      } catch (error) {
        if (signal.aborted) return;
        setRevenueByDay([]);
        setRevenueByRoomType([]);
        setRoomTypeUsagePercent([]);
        setRevenueByCustomerType([]);
        setChartsError(error?.message || "Không thể tải dữ liệu biểu đồ.");
      } finally {
        if (!signal.aborted) setChartsLoading(false);
      }
    };

    loadCharts();
    return () => abortController.abort();
  }, [selectedDate]);

  const selectedMonthText = selectedDate?.month ?? 0;
  const selectedYearText = selectedDate?.year ?? 0;

  return (
    <div className="baocao-page">
      <div className="baocao-header-row">
        <FeatureHeader
          title="Báo cáo thống kê"
          description="Xem báo cáo công suất phòng và doanh thu"
        />
        <div className="baocao-month-picker">
          <label>{"Chọn tháng"}</label>
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

      {chartsError && <div className="baocao-chart-error">{chartsError}</div>}

      <div className="baocao-charts-row">
        <ChartCard title="Doanh thu theo ngày">
          {chartsLoading ? (
            <ChartPlaceholder text="Đang tải dữ liệu..." />
          ) : (
            <BarChartPanel
              data={revenueByDay}
              color="#2563eb"
              emptyText={"Không có dữ liệu doanh thu theo ngày."}
            />
          )}
        </ChartCard>

        <ChartCard title="Doanh thu theo kênh">
          {chartsLoading ? (
            <ChartPlaceholder text="Đang tải dữ liệu..." />
          ) : (
            <PieChartPanel
              data={revenueByCustomerType}
              valueFormatter={formatCurrency}
              percentMode="share"
              emptyText={"Không có dữ liệu doanh thu theo kênh."}
            />
          )}
        </ChartCard>
      </div>

      <div className="baocao-charts-row">
        <ChartCard title="Doanh thu theo loại phòng">
          {chartsLoading ? (
            <ChartPlaceholder text="Đang tải dữ liệu..." />
          ) : (
            <BarChartPanel
              data={revenueByRoomType}
              color="#f97316"
              emptyText={"Không có dữ liệu doanh thu theo loại phòng."}
            />
          )}
        </ChartCard>

        <ChartCard title="Công suất theo loại phòng">
          {chartsLoading ? (
            <ChartPlaceholder text="Đang tải dữ liệu..." />
          ) : (
            <PieChartPanel
              data={roomTypeUsagePercent}
              valueFormatter={formatPercent}
              percentMode="value"
              emptyText={"Không có dữ liệu công suất theo loại phòng."}
            />
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default Baocao;
