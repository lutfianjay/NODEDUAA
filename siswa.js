const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const db = require("../config") //import konfigurasi database
const multer = require("multer") // untuk upload file
const path = require("path") // untuk memanggil path direktori
const fs = require("fs") // untuk manajemen file
const { error } = require("console")

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(__dirname));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // set file storage
        cb(null, './image');
    },
    filename: (req, file, cb) => {
        // generate file name 
        cb(null, "image-"+ Date.now() + path.extname(file.originalname))
    }
})

let upload = multer({storage: storage})

// endpoint untuk menambah data siswa
app.post("/", upload.single("image"), (req, res) => {
    // prepare data
    let data = {
        nis: req.body.nis,
        nama_siswa: req.body.nama_siswa,
        kelas: req.body.kelas,
        poin: req.body.poin,
        image : req.file.filename
    }

    if (!req.file) {
        // jika tidak ada file yang diupload
        res.json({
            message: "Tidak ada file yang dikirim"
        })
    } else {
        // create sql insert
        let sql = "insert into siswa set ?"

        // run query
        db.query(sql, data, (error, result) => {
            if(error) throw error
            res.json({
                message: result.affectedRows + " data berhasil disimpan"
            })
        })
    }
})

// end-point akses data siswa
app.get("/", (req, res) => {
    // create sql query
    let sql = "select * from siswa"

    // run query
    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message 
            }            
        } else {
            response = {
                count: result.length,
                guru: result 
            }            
        }
        res.json(response) 
    })
})

app.get("/:id", (req,res) => {
    let data = {
        id_siswa: req.params.id
    }

    let sql = "select * from siswa where ?"

    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message : error.message
            }
        } else {
            response = {
                count : result.length,
                guru : result
            }
        }
        res.json(response)
    })
})

// end-point mengubah data siswa
app.put("/:id", upload.single("image"), (req,res) => {
    let data = null, sql =  null
    // parameter perubahan data
    let param = {
        id_siswa : req.params.id
    }

    if (!req.file) {
        // jika tidak ada file yang dikirim = update data saja
        data = {
            nis: req.body.nis,
            nama_siswa: req.body.nama_siswa,
            kelas: req.body.kelas,
            poin: req.body.poin
        }
    } else {
        // jika mengirim file = update data + reupload
        data = {
            nis: req.body.nis,
            nama_siswa: req.body.nama_siswa,
            kelas: req.body.kelas,
            poin: req.body.poin,
            image : req.file.filename
        }

        // get data yang akan diupdate untuk mendapatkan nama file yang lama

        sql = "select * from siswa where ?"
        // run query
        db.query(sql, param, (error, result) => {
            if (error) throw error
            // tampung nama file yang lama
            let filename = result[0].image

            // hapus file yang lama
            let dir = path.join(__dirname,"image",filename)
            fs.unlink(dir, (error) => {})
        })
    }
    
    // create sql update
    sql = "update siswa set ? where ?"

    // jalankan sql update
    db.query(sql, [data,param], (error, result) => {
        if (error) {
            res.json({
                message: error.message
            })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil diubah"
            })
        }
    })

})

// endpoint untuk menghapus data siswa
app.delete("/:id", (req,res) => {
    let param = {id_siswa: req.params.id}

    // ambil data yang akan dihapus
    let sql = "select * from siswa where ?"
    // jalankan query
    db.query(sql, param, (error, result) => {
        if (error) throw error
        
        // tampung nama file yang lama
        let fileName = result[0].image

        // hapus file yg lama
        let dir = path.join(__dirname,"image",fileName)
        fs.unlink(dir, (error) => {})
    })

    // create sql delete
    sql = "delete from siswa where ?"

    // jalankan query
    db.query(sql, param, (error, result) => {
        if (error) {
            res.json({
                message: error.message
            })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil dihapus"
            })
        }      
    })
})

module.exports = app