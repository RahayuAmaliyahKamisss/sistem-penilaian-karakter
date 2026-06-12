const express = require("express")
const router = express.Router()
const db = require("../db")

router.post("/kelas-bulk", (req, res) => {
    const { daftar_kelas } = req.body;

    if (!daftar_kelas || daftar_kelas.length === 0) {
        return res.status(400).json({
            message: "Data kelas kosong"
        });
    }

    const values = daftar_kelas.map(nama => [nama]);

    db.query(
        "INSERT INTO kelas (nama_kelas) VALUES ?",
        [values],
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            res.json({
                message: "Kelas berhasil ditambahkan"
            });
        }
    );
});
router.delete("/kelas/:id", (req, res) => {

    const id = req.params.id;

    // hapus relasi guru-kelas dulu
    db.query(
        "DELETE FROM guru_kelas WHERE id_kelas = ?",
        [id],
        (err1) => {

            if (err1) {
                return res.status(500).json({
                    message: err1.message
                });
            }

            // hapus siswa
            db.query(
                "DELETE FROM siswa WHERE id_kelas = ?",
                [id],
                (err2) => {

                    if (err2) {
                        return res.status(500).json({
                            message: err2.message
                        });
                    }

                    // hapus kelas
                    db.query(
                        "DELETE FROM kelas WHERE id = ?",
                        [id],
                        (err3) => {

                            if (err3) {
                                return res.status(500).json({
                                    message: err3.message
                                });
                            }

                            res.json({
                                message: "Kelas berhasil dihapus"
                            });
                        }
                    );
                }
            );
        }
    );
});
router.get('/kelas', (req, res) => {
    const sql = `
        SELECT
            k.id,
            k.nama_kelas,
            COUNT(s.id) AS jumlah_siswa
        FROM kelas k
        LEFT JOIN siswa s ON k.id = s.id_kelas
        GROUP BY k.id, k.nama_kelas
        ORDER BY CAST(
            SUBSTRING_INDEX(k.nama_kelas, '-', -1)
            AS UNSIGNED
        )
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        res.json(result);
    });
});
router.post("/guru", (req, res) => {
    const { nama, nip, username, password } = req.body;

    if (!nama || !nip || !username || !password) {
        return res.status(400).json({
            message: "Data tidak lengkap"
        });
    }

    db.query(
        "INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, 'guru')",
        [nama, username, password],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            const userId = result.insertId;

            db.query(
                "INSERT INTO guru (user_id, nip) VALUES (?, ?)",
                [userId, nip],
                (err2) => {
                    if (err2) {
                        return res.status(500).json({
                            message: err2.message
                        });
                    }

                    res.json({
                        message: "Guru berhasil ditambahkan"
                    });
                }
            );
        }
    );
});
router.get("/guru", (req, res) => {
    const sql = `
        SELECT
            g.id,
            u.nama,
            u.username,
            g.nip
        FROM guru g
        JOIN users u ON g.user_id = u.id
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        res.json(result);
    });
});
router.get("/mapel", (req, res) => {
    db.query("SELECT * FROM mata_pelajaran ORDER BY nama_mapel ASC", (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: err.message
            });
        }

        res.json(result);
    });
});
// =====================
// 🗑️ HAPUS GURU
// =====================
router.delete("/guru/:id", (req, res) => {
    const id = req.params.id;

    console.log("ID DARI FRONTEND =", id);

    db.query(
        "SELECT * FROM guru WHERE id = ?",
        [id],
        (err, guruResult) => {

            if (err) {
                return res.status(500).json({message: err.message});
            }

            if (guruResult.length === 0) {
                return res.status(404).json({message: "Guru tidak ditemukan"});
            }

            const guruId = guruResult[0].id;

            db.query(
                "DELETE FROM guru_mapel WHERE id_guru = ?",
                [id],
                (err1) => {

                    if (err1)
                        return res.status(500).json({message: err1.message});

                    db.query(
                        "DELETE FROM guru_kelas WHERE id_guru = ?",
                        [guruId],
                        (err2) => {

                            if (err2)
                                return res.status(500).json({message: err2.message});

                            db.query(
                                "DELETE FROM guru WHERE id = ?",
                                [guruId],
                                (err3) => {

                                    if (err3)
                                        return res.status(500).json({message: err3.message});

                                    db.query(
                                        "DELETE FROM users WHERE id = ?",
                                        [id],
                                        (err4) => {

                                            if (err4)
                                                return res.status(500).json({message: err4.message});

                                            res.json({
                                                message: "Guru berhasil dihapus"
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});
router.get('/siswa/:id_kelas', (req, res) => {
    db.query(
        'SELECT * FROM siswa WHERE id_kelas = ? ORDER BY nama',
        [req.params.id_kelas],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            res.json(result);
        }
    );
});
router.post('/siswa-bulk', (req, res) => {
    const { id_kelas, daftar_nama } = req.body;

    if (!id_kelas || !daftar_nama) {
        return res.status(400).json({
            message: 'Data tidak lengkap'
        });
    }

    const names = daftar_nama
        .split('\n')
        .map(n => n.trim())
        .filter(n => n !== '');

    db.query(
    `DELETE ha
     FROM hasil_akhir ha
     JOIN siswa s ON ha.id_siswa = s.id
     WHERE s.id_kelas = ?`,
    [id_kelas],
    (err) => {

        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        db.query(
            'DELETE FROM siswa WHERE id_kelas = ?',
            [id_kelas],
            (err2) => {

                if (err2) {
                    return res.status(500).json({
                        message: err2.message
                    });
                }

                const values = names.map(nama => [nama, id_kelas]);

                db.query(
                    'INSERT INTO siswa (nama, id_kelas) VALUES ?',
                    [values],
                    (err3) => {

                        if (err3) {
                            return res.status(500).json({
                                message: err3.message
                            });
                        }

                        res.json({
                            message: 'Data siswa berhasil diperbarui'
                        });
                    }
                );
            }
        );
    }
);
});

// 🔗 MAPPING GURU-KELAS
// =====================
router.post("/mapping", (req, res) => {
    const { id_guru, id_mapel, id_kelas } = req.body;

    if (!id_guru || !id_mapel || !id_kelas || id_kelas.length === 0) {
        return res.status(400).json({
            message: "Data mapping tidak lengkap"
        });
    }

    // Hapus mapping lama
    db.query(
        "DELETE FROM guru_kelas WHERE id_guru = ? AND id_mapel = ?",
        [id_guru, id_mapel],
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            // Insert mapping baru
            const values = id_kelas.map(idKelas => [
                id_guru,
                id_mapel,
                idKelas
            ]);

            db.query(
                "INSERT INTO guru_kelas (id_guru, id_mapel, id_kelas) VALUES ?",
                [values],
                (err2) => {
                    if (err2) {
                        return res.status(500).json({
                            message: err2.message
                        });
                    }

                    res.json({
                        message: "Mapping berhasil disimpan"
                    });
                }
            );
        }
    );
});
router.get("/mapping", (req, res) => {
    const sql = `
        SELECT
            gr.id AS id_guru,
            mp.id AS id_mapel,
            u.nama,
            gr.nip,
            mp.nama_mapel AS mapel,
            GROUP_CONCAT(k.nama_kelas ORDER BY k.nama_kelas SEPARATOR ', ') AS daftar_kelas
        FROM guru_kelas gk
        JOIN guru gr ON gk.id_guru = gr.id
        JOIN users u ON gr.user_id = u.id
        JOIN mata_pelajaran mp ON gk.id_mapel = mp.id
        JOIN kelas k ON gk.id_kelas = k.id
        GROUP BY gr.id, mp.id
        ORDER BY u.nama, mp.nama_mapel
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        res.json(result);
    });
});
router.delete("/mapping-group/:id_guru/:id_mapel", (req, res) => {
    const { id_guru, id_mapel } = req.params;

    db.query(
        "DELETE FROM guru_kelas WHERE id_guru = ? AND id_mapel = ?",
        [id_guru, id_mapel],
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            res.json({
                message: "Mapping berhasil dihapus"
            });
        }
    );
});
module.exports = router