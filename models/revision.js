const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema maps to a MongoDB collection and defines the shape of the documents within that collection
let revisionsSchema = new Schema({
  articleTitle: String,
  user: String,
  timestamp: Date,
  revid: String,
  text: String
});

// instances of Models are documents
exports.Revision = mongoose.model('revisions', revisionsSchema);
