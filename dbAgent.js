// open a connection to the database on our locally running instance of MongoDB
const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/wikipedia')

// models
const Revision = require('./models/revision.js').Revision

// get notified if we connect successfully or if a connection error occurs
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  console.log('Connected to MongoDB')
})

const insertRevision = (revision, cb) => {
  Revision.create(revision, (err, obj) => {
    if (err) {
      console.log(err);
      process.exit()
    }
    else {
      cb(null, 'Revision Saved')
    }
  })
}

const findRevisionsByArticleTitle = (articleTitle, cb) => {
  let query = {"articleTitle":articleTitle}
  Revision.find(query, (err, revisions) => {
    if (err) {
      console.log(err);
      process.exit()
    }
    else {
      cb(revisions)
    }
  })
}

const findRevisionsByRevID = (revid, cb) => {
  let query = {"revid":revid}
  Revision.find(query, (err, revisions) => {
    if (err) {
      console.log(err);
      process.exit()
    }
    else {
      cb(revisions)
    }
  })
}

// EXPORTS
module.exports.insertRevision = insertRevision
module.exports.findRevisionsByArticleTitle = findRevisionsByArticleTitle
module.exports.findRevisionsByRevID = findRevisionsByRevID
