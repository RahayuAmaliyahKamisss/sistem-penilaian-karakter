const express = require("express");
const session = require("express-session");
const cors = require("cors");

const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
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
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});