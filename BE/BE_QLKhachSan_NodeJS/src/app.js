const express = require("express");
const cors = require("cors");

const roomTypeRoutes = require("./routes/roomTypeRoutes");
const authRoutes = require("./routes/authRoutes");
const rateRoutes = require("./routes/rateRoutes");
const customerRoutes = require("./routes/customerRoutes");
const receptionistRoutes = require("./routes/receptionistRoutes");
const roomRoutes = require("./routes/roomRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/get-room-types", roomTypeRoutes);
app.use("/api/login", authRoutes);
app.use("/api/rates", rateRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/receptionists", receptionistRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/invoices", invoiceRoutes);

module.exports = app;
