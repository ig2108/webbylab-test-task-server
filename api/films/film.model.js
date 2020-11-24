const mongoose = require('mongoose');
const { Schema } = mongoose;

const filmSchema = new Schema({
  title: { type: String, required: true },
  releaseYear: {
    type: Number,
    required: true,
  },
  format: {
    type: String,
    enum: ["VHS", "DVD", "Blu-Ray"],
    default: "DVD"
  },
  stars: {
    type: Array,
    required: true,
  },
});

const filmModel = mongoose.model('Film', filmSchema);

module.exports = filmModel;
