import React from "react";
import "../style/Baocao.css";
import { FeatureHeader } from "./Common";

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

const Baocao = () => {
  return (
    <div className="baocao-page">
      <div className="baocao-header-row">
        <FeatureHeader
          title="Báo cáo Thống kê"
          description="Xem báo cáo công suất phòng và doanh thu"
        />
        <div className="baocao-month-picker">
          <label>Chọn tháng</label>
          <input type="month" />
        </div>
      </div>

      <div className="baocao-stats-row">
        <StatCard
          label="Công suất phòng"
          value="0.0%"
          desc="0/32 phòng đang sử dụng"
          icon="%"
          color="#2563eb"
        />
        <StatCard
          label="Doanh thu"
          value="0đ"
          desc="Tháng tháng 3 năm 2026"
          icon="$"
          color="#22c55e"
        />
        <StatCard
          label="Lưu trú"
          value="0"
          desc="0 đặt trước, 0 walk-in"
          icon={<i className="fa-solid fa-users" />}
          color="#a855f7"
        />
        <StatCard
          label="Đặt phòng"
          value="0"
          desc="Đặt phòng trong tháng"
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