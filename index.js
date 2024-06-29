const path = require('path');
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');

const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/URL', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

// File schema
const fileSchema = new mongoose.Schema({
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

const File = mongoose.model('File', fileSchema);

// Multer setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()} - ${file.originalname}`);
    }
});

const upload = multer({ storage });

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', async (req, res) => {
    const files = await File.find();
    return res.render("home", { files });
});

app.post('/upload', upload.single("profileImage"), async (req, res) => {
    console.log(req.body);
    console.log(req.file);

    // Save file metadata to MongoDB
    const file = new File({
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
    });

    await file.save();

    return res.redirect("/");
});

app.get('/files/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).send('File not found');
        }

        res.set({
            'Content-Type': file.mimetype,
            'Content-Disposition': `attachment; filename="${file.filename}"`
        });

        fs.createReadStream(file.path).pipe(res);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/image/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).send('File not found');
        }

        res.set('Content-Type', file.mimetype);
        fs.createReadStream(file.path).pipe(res);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.listen(8000, () => {
    console.log('Server started on http://localhost:8000');
});
