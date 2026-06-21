const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/kelas', (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    const sql = `
        SELECT
            gk.id_mapel,
            mp.nama_mapel,
            k.id AS id_kelas,
            k.nama_kelas
        FROM guru_kelas gk
        JOIN guru g ON gk.id_guru = g.id
        JOIN mata_pelajaran mp ON gk.id_mapel = mp.id
        JOIN kelas k ON gk.id_kelas = k.id
        WHERE g.user_id = ?
        ORDER BY mp.nama_mapel, k.nama_kelas
    `;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.log('Error /kelas:', err);
            return res.status(500).json({
                message: err.message
            });
        }

        res.json(result);
    });
});


router.get('/siswa/:id_kelas', (req, res) => {
    const { id_kelas } = req.params;
    const id_guru = req.session.user.id;
        const sql = `
            SELECT
                s.id,
                s.nama,

                na.nilai AS nilai_akademik,

                CASE
                    WHEN COUNT(j.id) > 0 THEN 1
                    ELSE 0
                END AS kuesioner_selesai

            FROM siswa s

            LEFT JOIN nilai_akademik na
            ON s.id = na.id_siswa
            AND na.id_guru = ?

            LEFT JOIN jawaban j
                ON s.id = j.id_siswa  AND j.id_guru = ?

            WHERE s.id_kelas = ?

            GROUP BY
                s.id,
                s.nama,
                na.nilai

            ORDER BY s.nama
        `;
    db.query(sql, [id_guru, id_guru, id_kelas], (err, result) => {
        if (err) {
            console.log('Error /siswa:', err);
            return res.status(500).json({
                message: err.message
            });
        }

        res.json(result);
    });
});

router.get('/kuesioner', (req, res) => {
    const sql = `
        SELECT
            i.id AS id_indikator,
            i.nama AS nama_indikator,
            p.id AS id_pertanyaan,
            p.teks AS pertanyaan
        FROM indikator i
        LEFT JOIN pertanyaan p
            ON i.id = p.id_indikator
        ORDER BY i.id, p.id
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            console.log('Error /kuesioner:', err);
            return res.status(500).json({
                message: err.message
            });
        }

        const hasil = [];

        rows.forEach(row => {
            let indikator = hasil.find(
                item => item.id === row.id_indikator
            );

            if (!indikator) {
                indikator = {
                    id: row.id_indikator,
                    nama_indikator: row.nama_indikator,
                    pertanyaan: []
                };

                hasil.push(indikator);
            }

            if (row.id_pertanyaan) {
                indikator.pertanyaan.push({
                    id: row.id_pertanyaan,
                    pertanyaan: row.pertanyaan
                });
            }
        });

        res.json(hasil);
    });
});

router.post('/kuesioner/simpan', (req, res) => {
    console.log("SESSION =", req.session);
    console.log("USER =", req.session.user);
   const { id_siswa, id_guru, jawaban } = req.body;
    if (!id_siswa || !jawaban || jawaban.length === 0) {
        return res.status(400).json({
            message: 'Data tidak lengkap'
        });
    }
    db.query(
        'DELETE FROM jawaban WHERE id_siswa = ? AND id_guru = ?',
        [id_siswa, id_guru],
        (err) => {
            if (err) {
                console.log('Error delete jawaban:', err);
                return res.status(500).json({
                    message: err.message
                });
            }

            let selesai = 0;

            jawaban.forEach(item => {
                const sql = `
                    INSERT INTO jawaban
                    (id_siswa, id_guru, id_pertanyaan, skor)
                    VALUES (?, ?, ?, ?)
                `;

                db.query(
                    sql,
                    [
                        id_siswa,
                        id_guru,
                        item.id_pertanyaan,
                        item.skor
                    ],
                    (err) => {
                        if (err) {
                            console.log('Error insert jawaban:', err);
                            return res.status(500).json({
                                message: err.message
                            });
                        }

                        selesai++;

                        if (selesai === jawaban.length) {
                            res.json({
                                message: 'Kuesioner berhasil disimpan'
                            });
                        }
                    }
                );
            });
        }
    );
});
router.get('/hasil/:id_siswa', (req, res) => {
    const { id_siswa } = req.params;
    const id_guru = req.session.user.id;
    const sql = `
        SELECT
            i.nama AS nama_indikator,
            AVG(j.skor) AS rata_rata
        FROM jawaban j
        JOIN pertanyaan p ON j.id_pertanyaan = p.id
        JOIN indikator i ON p.id_indikator = i.id
        WHERE j.id_siswa = ? AND j.id_guru = ?
        GROUP BY i.id, i.nama
    `;

    db.query(sql, [id_siswa, id_guru], (err, indikator) => {
        const id_guru = req.session.user.id;
        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        db.query(
            
            'SELECT nilai FROM nilai_akademik WHERE id_siswa = ? AND id_guru = ? LIMIT 1',
            [id_siswa, id_guru],
            (err2, akademik) => {
                if (err2) {
                    return res.status(500).json({
                        message: err2.message
                    });
                }

                res.json({
                    nilai_akademik:
                        akademik.length > 0
                            ? akademik[0].nilai
                            : null,
                    indikator
                });
            }
        );
    });
});
router.get('/hasil-kelas/:id_kelas', (req, res) => {
    const { id_kelas } = req.params;

    const sql = `
        SELECT
            s.id,
            s.nama,
            na.nilai AS nilai_akademik,
            ha.total AS skor_sikap,
            ha.kategori
        FROM siswa s
        LEFT JOIN nilai_akademik na ON s.id = na.id_siswa AND na.id_guru = ?
        LEFT JOIN hasil_akhir ha ON s.id = ha.id_siswa AND ha.id_guru = ?
        WHERE s.id_kelas = ?
        ORDER BY s.nama ASC
    `;
    const id_guru = req.session.user.id;
    db.query(sql, [id_guru, id_kelas], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: 'Gagal mengambil data hasil.'
            });
        }

        res.json(results);
    });
});
router.get('/hasil-akhir/:id_kelas', (req, res) => {
    const { id_kelas } = req.params;
    const id_guru = req.session.user.id;
    const sql = `
        SELECT
            s.id,
            s.nama,
            na.nilai AS nilai_akademik,
            ha.total,
            ha.nilai_z,
            ha.nilai_fuzzy,
            ha.kategori
        FROM siswa s
        LEFT JOIN nilai_akademik na
            ON s.id = na.id_siswa 
            AND na.id_guru = ?
        LEFT JOIN hasil_akhir ha
            ON s.id = ha.id_siswa
            AND ha.id_guru = ?
        WHERE s.id_kelas = ?
        ORDER BY s.nama ASC
    `;

    db.query(sql, [id_guru, id_guru, id_kelas], (err, results) => {
        if (err) {
            console.error('Error mengambil hasil akhir:', err);
            return res.status(500).json({
                message: 'Gagal mengambil data hasil akhir'
            });
        }

        res.json(results);
    });
});
router.post('/nilai-akademik/simpan', (req, res) => {
    const { id_siswa, nilai } = req.body;
    const id_guru = req.session.user.id;
    if (!id_siswa || nilai === undefined) {
        return res.status(400).json({
            message: 'Data tidak lengkap'
        });
    }

    // Hapus data lama agar bisa update
    db.query(
        'DELETE FROM nilai_akademik WHERE id_siswa = ? AND id_guru=?',
        [id_siswa, id_guru],
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            db.query(
                'INSERT INTO nilai_akademik (id_siswa, id_guru, nilai) VALUES (?, ?, ?)',
                [id_siswa, id_guru, nilai],
                (err2) => {
                    if (err2) {
                        return res.status(500).json({
                            message: err2.message
                        });
                    }

                    res.json({
                        message: 'Nilai akademik berhasil disimpan.'
                    });
                }
            );
        }
    );
});
router.post('/proses-metode', (req, res) => {
    const id_guru = req.session.user.id;
    const { id_kelas } = req.body;

    if (!id_kelas) {
        return res.status(400).json({
            message: 'ID kelas tidak ditemukan'
        });
    }

    const sql = `
        SELECT
            s.id,
            s.nama,
            AVG(j.skor) AS nilai_karakter
        FROM siswa s
        LEFT JOIN jawaban j
            ON s.id = j.id_siswa AND j.id_guru = ?
        WHERE s.id_kelas = ?
        GROUP BY s.id, s.nama
        ORDER BY s.nama ASC
    `;

    db.query(sql, [id_guru, id_kelas], (err, rows) => {

        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        const dataValid =
            rows.filter(
                row => row.nilai_karakter !== null
            );

        if (dataValid.length === 0) {
            return res.status(400).json({
                message:
                    'Belum ada data kuesioner.'
            });
        }

        // ==================================
        // 1. NORMALISASI NILAI KARAKTER
        // ==================================

        dataValid.forEach(row => {

            const nilai =
                parseFloat(row.nilai_karakter);

            row.total =
                Math.max(
                    0,
                    Math.min(
                        100,
                        (nilai / 5) * 100
                    )
                );
        });

        // ==================================
        // 2. FUZZY MAMDANI
        // ==================================

        dataValid.forEach(row => {

            const total =
                parseFloat(
                    row.total.toFixed(2)
                );

            let kurang = 0;
            let cukup = 0;
            let baik = 0;
            let sangatBaik = 0;

            // ------------------
            // FUZZIFIKASI
            // ------------------

            if (total <= 55) {
                kurang = 1;
            }else if(total >50 && total<60){
                kurang = (60 - total)/10;
            }
            if (total >= 50 &&total <= 62.5) {
                cukup =(total - 50) / 12.5;
            }else if (total > 62.5 && total <=75){
                cukup = (75 - total)/ 12.5;
            }
            if (total >= 62.5 && total <= 77.5) {
                baik =(total - 65) / 12.5;
            } else if(total > 77.5 && total <=90){
                baik = (90 - total)/12.5;
            }
            if (total >= 80 && total <=90) {
                sangatBaik = (total - 80) / 10;
            } else if (total > 90){
                sangatBaik = 1;
            }
            // ------------------
            // RULE BASE
            // ------------------
            const ruleKurang = kurang;
            const ruleCukup = cukup;
            const ruleBaik = baik;
            const ruleSangatBaik = sangatBaik;
            // ------------------
            // DEFUZZIFIKASI
            // ------------------
            const pembilang =(ruleKurang * 50) +(ruleCukup * 65) +(ruleBaik * 80) +(ruleSangatBaik * 95);
            const penyebut = ruleKurang + ruleCukup + ruleBaik +ruleSangatBaik;
            let nilai_fuzzy = 0;
            if (penyebut !== 0) {
                nilai_fuzzy =pembilang /penyebut;
            }
            row.nilai_fuzzy =
                parseFloat(nilai_fuzzy.toFixed(2)
                );
        });

        // ==================================
        // 3. MEAN NILAI FUZZY
        // ==================================

        const mean =
            dataValid.reduce((sum, row) =>sum +row.nilai_fuzzy,0
            ) / dataValid.length;

        // ==================================
        // 4. STANDAR DEVIASI
        // ==================================

        const variance =
            dataValid.reduce((sum, row) =>sum +Math.pow(row.nilai_fuzzy -mean,2),0) / dataValid.length;
        const stdDev =Math.sqrt(variance);
        // ==================================
        // HAPUS DATA LAMA
        // ==================================

        const deleteSql = `
            DELETE ha
            FROM hasil_akhir ha
            JOIN siswa s
                ON ha.id_siswa = s.id
            WHERE s.id_kelas = ?
            AND ha.id_guru = ?
        `;

        db.query(
            deleteSql,
            [id_kelas, id_guru],
            (err) => {

                if (err) {

                    return res
                        .status(500)
                        .json({
                            message:
                                err.message
                        });
                }

                let selesai = 0;

                // ==========================
                // 5. Z-SCORE
                // ==========================

                dataValid.forEach(row => {
                    let nilai_z = 0;
                    if (stdDev !== 0) {
                        nilai_z = (row.nilai_fuzzy - mean) / stdDev;
                    }
                    nilai_z = parseFloat(nilai_z.toFixed(4));

                    // ==========================
                    // 6. HYPERPARAMETER
                    // ==========================

                    const hyperparameter = 3;
                    let nilai_akhir =row.nilai_fuzzy +(nilai_z *hyperparameter);
                    nilai_akhir =
                        Math.max(0,Math.min(100,nilai_akhir)
                        );
                    nilai_akhir =
                        parseFloat(nilai_akhir.toFixed(2)
                        );

                    // ==========================
                    // 7. KATEGORI
                    // ==========================

                    let kategori =
                        'Kurang';

                    if (
                        nilai_akhir >= 85
                    ) {
                        kategori =
                            'Sangat Baik';
                    }
                    else if (
                        nilai_akhir >= 70
                    ) {
                        kategori =
                            'Baik';
                    }
                    else if (
                        nilai_akhir >= 55
                    ) {
                        kategori =
                            'Cukup';
                    }

                    // ==========================
                    // SIMPAN
                    // ==========================

                    const insertSql = `
                    INSERT INTO hasil_akhir
                    (
                        id_siswa,
                        id_guru,
                        total,
                        nilai_z,
                        nilai_fuzzy,
                        kategori
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    `;

                    db.query(
                        insertSql,
                        [
                            row.id,
                            id_guru,
                            row.total,
                            nilai_z,
                            nilai_akhir,
                            kategori
                        ],
                        (err) => {

                            if (err) {

                                return res
                                    .status(500)
                                    .json({
                                        message:
                                            err.message
                                    });
                            }

                            selesai++;

                            if (
                                selesai ===
                                dataValid.length
                            ) {

                                res.json({
                                    message:
                                        'Proses metode berhasil dilakukan.'
                                });
                            }
                        }
                    );
                });
            }
        );
    });
});
module.exports = router;