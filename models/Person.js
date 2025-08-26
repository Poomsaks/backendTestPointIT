const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    name: { type: String, required: true },
    id_card: { type: String, required: true, unique: true },
    lat: { type: Number },
    long: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Person', personSchema);
