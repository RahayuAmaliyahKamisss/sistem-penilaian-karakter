const express = require("express")
const router = express.Router()
const db = require("../db")

router.post("/login", (req, res) => {
    const { username, password } = req.body

    const query = "SELECT * FROM users WHERE username=? AND password=?"

    db.query(query, [username, password], (err, result) => {
        if (err) throw err

        if (result.length > 0) {

    req.session.user = result[0];

    console.log("LOGIN SUCCESS");
    console.log(req.session.user);

    req.session.save((err) => {

        if (err) {
            console.log("SESSION ERROR:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        console.log("SESSION SAVED");
        console.log(req.session);

        res.json({
            success: true,
            user: result[0]
        });
    });

} else {

    res.json({
        success: false
    });

}
    })
})
router.get("/cek-session", (req, res) => {
    res.json(req.session);
});
router.get("/debug-session", (req, res) => {
    res.json({
        sessionID: req.sessionID,
        session: req.session
    });
});
module.exports = router