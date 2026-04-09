import React, { Component } from "react";
import "../style/Tongquan.css";
import { FeatureHeader } from "./Common";

const OVERVIEW_API_BASE_URL = "http://localhost:3000/api/overview";
const ROOM_STATISTICS_API_URL = `${OVERVIEW_API_BASE_URL}/room-statistics`;
const OCCUPANCY_RATE_API_URL = `${OVERVIEW_API_BASE_URL}/occupancy-rate`;
const ROOM_STATUS_SUMMARY_API_URL = `${OVERVIEW_API_BASE_URL}/room-status-summary`;
const CUSTOMER_SUMMARY_API_URL = `${OVERVIEW_API_BASE_URL}/customer-summary`;
const TODAY_CHECKIN_CHECKOUT_API_URL = `${OVERVIEW_API_BASE_URL}/today-checkin-checkout`;
const REVENUE_THIS_MONTH_API_URL = `${OVERVIEW_API_BASE_URL}/revenue-this-month`;

class Tongquan extends Component {
  state = {
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    occupancyRate: 0,
    dirtyRooms: 0,
    totalCustomers: 0,
    stayingGuests: 0,
    todayCheckIn: 0,
    todayCheckOut: 0,
    totalStays: 0,
    totalRevenue: 0,
  };

  componentDidMount() {
    this.fetchOverviewData();
  }

  getNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  request = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const text = await response.text();
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  };

  fetchOverviewData = async () => {
    const [
      roomStatisticsResult,
      occupancyRateResult,
      roomStatusSummaryResult,
      customerSummaryResult,
      todayCheckinCheckoutResult,
      revenueThisMonthResult,
    ] = await Promise.allSettled([
      this.request(ROOM_STATISTICS_API_URL),
      this.request(OCCUPANCY_RATE_API_URL),
      this.request(ROOM_STATUS_SUMMARY_API_URL),
      this.request(CUSTOMER_SUMMARY_API_URL),
      this.request(TODAY_CHECKIN_CHECKOUT_API_URL),
      this.request(REVENUE_THIS_MONTH_API_URL),
    ]);

    const roomStatistics =
      roomStatisticsResult.status === "fulfilled" ? roomStatisticsResult.value : {};
    const occupancyRate =
      occupancyRateResult.status === "fulfilled" ? occupancyRateResult.value : {};
    const roomStatusSummary =
      roomStatusSummaryResult.status === "fulfilled"
        ? roomStatusSummaryResult.value
        : {};
    const customerSummary =
      customerSummaryResult.status === "fulfilled" ? customerSummaryResult.value : {};
    const todayCheckinCheckout =
      todayCheckinCheckoutResult.status === "fulfilled"
        ? todayCheckinCheckoutResult.value
        : {};
    const revenueThisMonth =
      revenueThisMonthResult.status === "fulfilled" ? revenueThisMonthResult.value : {};

    this.setState({
      totalRooms: this.getNumber(
        roomStatistics.TotalRooms ?? roomStatistics.totalRooms,
      ),
      availableRooms: this.getNumber(
        roomStatistics.AvailableRooms ?? roomStatistics.availableRooms,
      ),
      occupiedRooms: this.getNumber(
        roomStatistics.OccupiedRooms ?? roomStatistics.occupiedRooms,
      ),
      occupancyRate: this.getNumber(
        occupancyRate.OccupancyRate ?? occupancyRate.occupancyRate,
      ),
      dirtyRooms: this.getNumber(
        roomStatusSummary.DirtyRooms ?? roomStatusSummary.dirtyRooms,
      ),
      totalCustomers: this.getNumber(
        customerSummary.TotalCustomers ?? customerSummary.totalCustomers,
      ),
      stayingGuests: this.getNumber(
        customerSummary.StayingGuests ?? customerSummary.stayingGuests,
      ),
      todayCheckIn: this.getNumber(
        todayCheckinCheckout.TodayCheckIn ?? todayCheckinCheckout.todayCheckIn,
      ),
      todayCheckOut: this.getNumber(
        todayCheckinCheckout.TodayCheckOut ?? todayCheckinCheckout.todayCheckOut,
      ),
      totalStays: this.getNumber(
        revenueThisMonth.TotalStays ?? revenueThisMonth.totalStays,
      ),
      totalRevenue: this.getNumber(
        revenueThisMonth.TotalRevenue ?? revenueThisMonth.totalRevenue,
      ),
    });
  };

  render() {
    const {
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate,
      dirtyRooms,
      totalCustomers,
      stayingGuests,
      todayCheckIn,
      todayCheckOut,
      totalStays,
      totalRevenue,
    } = this.state;

    return (
      <>
        <div className="tongquan">
          <FeatureHeader
            title={"T\u1ed5ng quan"}
            description={
              "Ch\u00e0o m\u1eebng \u0111\u1ebfn v\u1edbi h\u1ec7 th\u1ed1ng qu\u1ea3n l\u00fd kh\u00e1ch s\u1ea1n"
            }
          />
          <div className="tongquan-mid">
            <Cards
              title={"T\u1ed5ng s\u1ed1 ph\u00f2ng"}
              logo={"fa-solid fa-building"}
              number={totalRooms}
              desc={`Tr\u1ed1ng: ${availableRooms} | \u0110ang d\u00f9ng: ${occupiedRooms}`}
            />
            <Cards
              title={"C\u00f4ng su\u1ea5t ph\u00f2ng"}
              logo={"fa-solid fa-bed"}
              number={`${occupancyRate}%`}
              desc={""}
            />
            <Cards
              title={"Check-in/out h\u00f4m nay"}
              logo={"fa-solid fa-calendar-check"}
              number={`${todayCheckIn}/${todayCheckOut}`}
              desc={"Nh\u1eadn / Tr\u1ea3 ph\u00f2ng"}
            />
            <Cards
              title={"Doanh thu th\u00e1ng n\u00e0y"}
              logo={"fa-solid fa-money-bill"}
              number={`${totalRevenue.toLocaleString("vi-VN")} VND`}
              desc={`T\u1eeb ${totalStays} l\u01b0\u1ee3t l\u01b0u tr\u00fa`}
            />
          </div>
          <div className="tongquan-low">
            <Activity
              title={"Tr\u1ea1ng th\u00e1i ph\u00f2ng"}
              items={[
                {
                  label: "Ph\u00f2ng tr\u1ed1ng",
                  value: availableRooms,
                  color: "green",
                  className: "phongtrong",
                },
                {
                  label: "\u0110ang s\u1eed d\u1ee5ng",
                  value: occupiedRooms,
                  color: "blue",
                  className: "dangsudung",
                },
                {
                  label: "C\u1ea7n d\u1ecdn d\u1eb9p",
                  value: dirtyRooms,
                  color: "orange",
                  className: "candondep",
                },
              ]}
            />

            <Activity
              title={"Th\u00f4ng tin kh\u00e1ch"}
              items={[
                {
                  label: "T\u1ed5ng kh\u00e1ch h\u00e0ng",
                  logo: "fa-solid fa-user",
                  value: totalCustomers,
                },
                {
                  label: "\u0110ang l\u01b0u tr\u00fa",
                  logo: "fa-solid fa-user-check",
                  value: stayingGuests,
                },
              ]}
            />
          </div>
        </div>
      </>
    );
  }
}

function Cards({ title, logo, number, desc }) {
  return (
    <>
      <div className="card">
        <h3>{title}</h3>
        <i className={logo}></i>
        <p className="number">{number}</p>
        <span>{desc}</span>
      </div>
    </>
  );
}

function Activity({ title, items }) {
  return (
    <div className="activity">
      <h3>{title}</h3>

      {items.map((item, index) => (
        <div className={`act ${item.className || ""}`} key={index}>
          <div className="act-left">
            {item.logo && <i className={item.logo}></i>}
            <p className={item.color}>{item.label}</p>
          </div>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default Tongquan;
