const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Person = require('./models/Person');

const app = express();
app.use(bodyParser.json());

// เชื่อม MongoDB
mongoose.connect('mongodb://localhost:27017/yourdb')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));
// ---------------------- CRUD ----------------------

// เพิ่มข้อมูล
app.post('/api/person', async (req, res) => {
    try {
        const person = new Person(req.body);
        await person.save();
        res.status(201).json(person);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// แก้ไขข้อมูล (ตาม ID Mongo)
app.put('/api/person/:id', async (req, res) => {
    try {
        const person = await Person.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!person) return res.status(404).json({ message: 'Not found' });
        res.json(person);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// ลบข้อมูล (ตาม ID Mongo)
app.delete('/api/person/:id', async (req, res) => {
    try {
        const person = await Person.findByIdAndDelete(req.params.id);
        if (!person) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ค้นหา Mongo 
app.get('/api/person', async (req, res) => {
    try {
        const persons = await Person.find();
        if (persons.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(persons);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// ค้นหาตาม Mongo ID
app.get('/api/person/id/:id', async (req, res) => {
    try {
        const person = await Person.findById(req.params.id);
        if (!person) return res.status(404).json({ message: 'Not found' });
        res.json(person);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ค้นหาตาม name หรือ id_card
app.get('/api/person/search', async (req, res) => {
    try {
        const { name, id_card } = req.query;
        const query = {};

        if (name) {
            // ใช้ regex เพื่อค้นหาแบบ partial match ไม่สนใจตัวพิมพ์ใหญ่/เล็ก
            query.name = new RegExp(name, 'i');
        }

        if (id_card) {
            query.id_card = id_card;
        }

        const persons = await Person.find(query);

        if (persons.length === 0) return res.status(404).json({ message: 'Not found' });

        res.json(persons);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// API ดึง lat, long ทั้งหมด
app.get('/api/person/location', async (req, res) => {
    try {
        const locations = await Person.find({}, { name: 1, lat: 1, long: 1, _id: 0 });
        res.json(locations);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// ค้นหาพร้อม pagination
app.get('/api/person/search-by-pagination', async (req, res) => {
    try {
        const { name, id_card, page = 1, limit = 10 } = req.query;

        const query = {};
        if (name) query.name = new RegExp(name, 'i');
        if (id_card) query.id_card = id_card;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // ดึงข้อมูลพร้อม pagination
        const [total, persons] = await Promise.all([
            Person.countDocuments(query),           // นับจำนวนทั้งหมด
            Person.find(query)
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ name: 1 })              // สามารถแก้ sort ตามต้องการ
        ]);

        res.json({
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data: persons
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// ---------------------- Start Server ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
