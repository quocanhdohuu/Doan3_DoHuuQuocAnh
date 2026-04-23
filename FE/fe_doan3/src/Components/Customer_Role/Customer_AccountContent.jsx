import React from "react";

function CustomerAccountContent({ user }) {
  const displayName = user?.name?.trim() || "Guest";
  const email = user?.email?.trim() || "N/A";

  return (
    <main className="customer-main-content">
      <section className="customer-placeholder-section">
        <p className="customer-section-label">COMING SOON</p>
        <h2>Tài khoản khách hàng</h2>
        <p>Prototype trang tài khoản sẽ được gắn tại đây.</p>
        <p className="customer-account-summary">Tên hiển thị: {displayName}</p>
        <p className="customer-account-summary">Email: {email}</p>
      </section>
    </main>
  );
}

export default CustomerAccountContent;
