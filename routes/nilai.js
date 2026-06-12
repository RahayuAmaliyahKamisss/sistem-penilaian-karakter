router.post("/nilai", (req, res) => {
    const { id_siswa, id_indikator, nilai } = req.body
    const id_guru = req.session.user.id

    const query = `
        INSERT INTO penilaian (id_siswa, id_guru, id_indikator, nilai)
        VALUES (?, ?, ?, ?)
    `

    db.query(query, [id_siswa, id_guru, id_indikator, nilai], (err) => {
        if (err) throw err
        res.json({ message: "Nilai tersimpan" })
    })
})