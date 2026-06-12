const express = require("express");
const session = require("express-session");
const cors = require("cors");

const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true
}));

// Static file
app.use(express.static("public"));

// =====================
// ROUTES
// =====================
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const guruRoutes = require("./routes/guru");
app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/guru", guruRoutes);

// =====================
// ROOT
// =====================
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

// =====================
// START SERVER
// =====================
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});