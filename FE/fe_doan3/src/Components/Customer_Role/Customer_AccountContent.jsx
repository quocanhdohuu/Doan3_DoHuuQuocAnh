import React, { useEffect, useMemo, useState } from "react";
import "../../style/Customer_main.css";

const CUSTOMER_INFO_API_BASE_URL = "http://localhost:3000/api/customers";

const resolveUserId = (user) => {
  const candidates = [
    user?.userId,
    user?.UserID,
    user?.id,
    user?.ID,
    user?.account?.UserID,
  ];

  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const normalizeAccountData = (payload, fallbackUser) => {
  const source = payload && typeof payload === "object" ? payload : {};
  const fullName =
    source?.FullName ?? source?.fullName ?? fallbackUser?.name ?? "Guest";
  const email = source?.Email ?? source?.email ?? fallbackUser?.email ?? "";

  return {
    FullName: String(fullName || "").trim(),
    Email: String(email || "").trim(),
    Phone: String(source?.Phone ?? source?.phone ?? "").trim(),
    CCCD: String(source?.CCCD ?? source?.cccd ?? "").trim(),
    PasswordHash: String(source?.PasswordHash ?? source?.passwordHash ?? "").trim(),
    TotalStay: Math.max(0, Number(source?.TotalStay ?? source?.totalStay ?? 0) || 0),
  };
};

const splitName = (fullName) => {
  const clean = String(fullName || "").trim();
  if (!clean) return { first: "Guest", second: "Member" };
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { first: parts[0], second: "Member" };
  return {
    first: parts.slice(0, 2).join(" "),
    second: parts.slice(2).join(" ") || "Member",
  };
};

const readResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const buildErrorMessage = (body, statusCode) => {
  if (typeof body === "string" && body.trim()) return body;

  if (body && typeof body === "object") {
    return (
      body?.message ||
      body?.Message ||
      body?.error ||
      body?.detail ||
      `API error: ${statusCode}`
    );
  }

  return `API error: ${statusCode}`;
};

function CustomerAccountContent({ user }) {
  const userId = useMemo(() => resolveUserId(user), [user]);
  const [accountData, setAccountData] = useState(null);
  const [form, setForm] = useState({
    FullName: "",
    Email: "",
    Phone: "",
    CCCD: "",
    PasswordHash: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadCustomerInfo = async () => {
      if (!userId) {
        setError("Khong tim thay UserID. Vui long dang nhap lai.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSaveMessage("");

        const response = await fetch(
          `${CUSTOMER_INFO_API_BASE_URL}/info/${userId}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const payload = await response.json();
        const normalized = normalizeAccountData(payload, user);
        setAccountData(normalized);
        setForm({
          FullName: normalized.FullName,
          Email: normalized.Email,
          Phone: normalized.Phone,
          CCCD: normalized.CCCD,
          PasswordHash: normalized.PasswordHash,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err?.message || "Khong the tai thong tin tai khoan.");
          setAccountData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCustomerInfo();
    return () => controller.abort();
  }, [userId, user]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    if (!accountData) return;
    setForm({
      FullName: accountData.FullName,
      Email: accountData.Email,
      Phone: accountData.Phone,
      CCCD: accountData.CCCD,
      PasswordHash: accountData.PasswordHash,
    });
    setSaveMessage("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!userId || saving) return;

    const payload = {
      FullName: form.FullName.trim(),
      Email: form.Email.trim(),
      Phone: form.Phone.trim(),
      CCCD: form.CCCD.trim(),
      PasswordHash: form.PasswordHash.trim(),
    };

    if (!payload.FullName || !payload.Email) {
      setError("FullName va Email là bắt buộc.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSaveMessage("");

      const response = await fetch(
        `${CUSTOMER_INFO_API_BASE_URL}/profile/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const body = await readResponseBody(response);
      if (!response.ok) {
        throw new Error(buildErrorMessage(body, response.status));
      }

      const merged = {
        ...(accountData || normalizeAccountData({}, user)),
        ...payload,
      };

      setAccountData(merged);
      setForm(payload);
      setIsEditing(false);
      setSaveMessage(body?.message || body?.Message || "Cập nhật thành công.");
    } catch (err) {
      setError(err?.message || "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const display = accountData || normalizeAccountData({}, user);
  const profileName = splitName(display.FullName);

  return (
    <main className="customer-main-content customer-account-content">
      <section className="customer-account-shell">
        {loading && <div className="customer-status-box">Đang tải thông tin tài khoản...</div>}

        {!loading && error && (
          <div className="customer-status-box customer-status-box--error">{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="customer-account-top-grid">
              <article className="customer-account-identity-card">
                <div className="customer-account-avatar" aria-hidden="true">
                  {display.FullName?.trim()?.charAt(0)?.toUpperCase() || "G"}
                </div>

                <div className="customer-account-identity-copy">
                  <h2>{profileName.first} {profileName.second}</h2>
                </div>

                <button
                  type="button"
                  className="customer-account-link-btn"
                  onClick={() => setIsEditing(true)}
                >
                  Thay đổi thông tin
                </button>
              </article>

              <article className="customer-account-reward-card">
                <h3>{display.TotalStay.toLocaleString("en-US")}</h3>
                <span>Tổng số lần lưu trú đã hoàn thành</span>
                <i className="fa-solid fa-star" aria-hidden="true"></i>
              </article>
            </div>

            <article className="customer-account-info-card">
              <div className="customer-account-info-head">
                <h3>Thông tin cá nhân</h3>

                {!isEditing ? (
                  <button
                    type="button"
                    className="customer-account-edit-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="fa-solid fa-pen" aria-hidden="true"></i>
                    Thay đổi thông tin
                  </button>
                ) : (
                  <div className="customer-account-edit-actions">
                    <button
                      type="button"
                      className="customer-account-cancel-btn"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="customer-account-save-btn"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                  </div>
                )}
              </div>

              {saveMessage && (
                <p className="customer-account-save-message">{saveMessage}</p>
              )}

              <div className="customer-account-info-grid">
                <label>
                  Họ và tên
                  <input
                    type="text"
                    name="FullName"
                    value={form.FullName}
                    onChange={handleInputChange}
                    disabled={!isEditing || saving}
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="Email"
                    value={form.Email}
                    onChange={handleInputChange}
                    disabled={!isEditing || saving}
                  />
                </label>

                <label>
                  Phone 
                  <input
                    type="text"
                    name="Phone"
                    value={form.Phone}
                    onChange={handleInputChange}
                    disabled={!isEditing || saving}
                  />
                </label>

                <label>
                  CCCD
                  <input
                    type="text"
                    name="CCCD"
                    value={form.CCCD}
                    onChange={handleInputChange}
                    disabled={!isEditing || saving}
                  />
                </label>

                <label className="customer-account-full-row">
                  Password 
                  <input
                    type="text"
                    name="PasswordHash"
                    value={form.PasswordHash}
                    onChange={handleInputChange}
                    disabled={!isEditing || saving}
                  />
                </label>
              </div>
            </article>

            <div className="customer-account-bottom-grid">
              <article className="customer-account-setting-card">
                <h4>Cài đặt thông báo</h4>
                <p>Quản lý cách chúng tôi liên hệ với bạn về việc đặt chỗ và các ưu đãi đặc biệt.</p>
                <div className="customer-account-toggle-row">
                  <span>Email</span>
                  <span className="customer-account-toggle active" aria-hidden="true"></span>
                </div>
                <div className="customer-account-toggle-row">
                  <span>SMS</span>
                  <span className="customer-account-toggle" aria-hidden="true"></span>
                </div>
              </article>

              <article className="customer-account-setting-card customer-account-setting-card--wide">
                <div className="customer-account-setting-head">
                  <h4>Sở thích phòng</h4>
                  <button type="button">Quản lý</button>
                </div>
                <p>
                  Chúng tôi sử dụng những thông tin chi tiết này để điều chỉnh việc bố trí phòng cho phù hợp nhất có thể.
                </p>
                <div className="customer-account-chip-row">
                  <span>Tầng cao</span>
                  <span>Khu vực Yên tĩnh</span>
                  <span>King Bed</span>
                  <span>Extra Pillows</span>
                </div>
              </article>
            </div>

            <article className="customer-account-security-bar">
              <div>
                <h4>An toàn tài khoản</h4>
              </div>
              <div className="customer-account-security-actions">
                <button type="button" className="customer-account-soft-btn">
                  Two-Factor Auth
                </button>
                <button type="button" className="customer-account-primary-btn">
                  Change Password
                </button>
              </div>
            </article>
          </>
        )}
      </section>
    </main>
  );
}

export default CustomerAccountContent;
