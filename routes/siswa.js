const express = require("express")
const router = express.Router()
const db = require("../db")

router.get("/siswa", (req, res) => {
    const user = req.session.user

    if (!user) return res.json([])

    const query = `
        SELECT siswa.* FROM siswa
        JOIN guru_kelas ON siswa.id_kelas = guru_kelas.id_kelas
        WHERE guru_kelas.id_guru = ?
    `

    db.query(query, [user.id], (err, result) => {
        if (err) throw err
        res.json(result)
    })
})

module.exports = router