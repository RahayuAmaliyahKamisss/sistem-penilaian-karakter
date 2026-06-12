const express = require("express")
const router = express.Router()
const db = require("../db")

router.post("/login", (req, res) => {
    const { username, password } = req.body

    const query = "SELECT * FROM users WHERE username=? AND password=?"

    db.query(query, [username, password], (err, result) => {
        if (err) throw err

        if (result.length > 0) {
            req.session.user = result[0]
            res.json({ success: true, user: result[0]})
        } else {
            res.json({ success: false })
        }
    })
})

module.exports = router