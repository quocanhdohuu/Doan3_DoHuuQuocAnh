import React, { Component } from "react";
import "../style/Tongquan.css";
class Tongquan extends Component {
  render() {
    return (
      <>
        <div className="tongquan">
          <div className="tongquan-top">
            <h2>Tổng quan</h2>
            <p>Chào mừng đến với hệ thống quản lý khách sạn</p>
          </div>
          <div className="tongquan-mid">
            <Cards
              title={"Tổng số phòng"}
              logo={"fa-regular fa-building"}
              number={"0"}
              desc={"Trống: | Đang dùng: "}
            />
            <Cards
              title={"Tổng số phòng"}
              logo={"fa-regular fa-building"}
              number={"0"}
              desc={"Trống: | Đang dùng: "}
            />
            <Cards
              title={"Tổng số phòng"}
              logo={"fa-regular fa-building"}
              number={"0"}
              desc={"Trống: | Đang dùng: "}
            />
            <Cards
              title={"Tổng số phòng"}
              logo={"fa-regular fa-building"}
              number={"0"}
              desc={"Trống: | Đang dùng: "}
            />
          </div>
          <div className="tongquan-low">
            <div className="activity">
              <h3>Trạng thái phòng</h3>
              <div className="act phongtrong">
                <p className="green">Phòng trống</p>
                <span>0</span>
              </div>
              <div className="act dangsudung">
                <p className="blue">Đang sử dụng</p>
                <span>0</span>
              </div>
              <div className="act candondep">
                <p className="orange">Cần dọn dẹp</p>
                <span>0</span>
              </div>
            </div>
            <div className="activity">
              <h3>Thông tin khách</h3>
              <div className="act">
                <p>Tổng khách hàng</p>
                <span>0</span>
              </div>
              <div className="act">
                <p>Đang lưu trú</p>
                <span>0</span>
              </div>
            </div>
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

export default Tongquan;
