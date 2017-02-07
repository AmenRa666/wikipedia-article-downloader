// MODULES
const mongoose = require('mongoose')
// mongoose.connect('mongodb://localhost/wikipedia')

// models
// const Revision = require('./models/revision.js').Revision
const Revision = require('./models/revisionFA.js').Revision

// open a connection to the database on our locally running instance of MongoDB
var options = {
  server: {
    socketOptions: {
      keepAlive: 3000000,
      connectTimeoutMS: 300000
     }
   },
   replset: {
    socketOptions: {
      keepAlive: 3000000,
      connectTimeoutMS : 300000
    }
  }
}

var mongodbUri = 'mongodb://localhost/wikipedia'

mongoose.connect(mongodbUri, options)


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

const findOneRevisionsByArticleTitle = (articleTitle, cb) => {
  let query = {"articleTitle":articleTitle}
  Revision.findOne(query, (err, revisions) => {
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

let i = 1

const updateRevisionByRevID = (revid, text, cb) => {
  Revision.update({ revid: revid }, { $set: { text: text }}, (err, obj) => {
    if (err) {
      console.log(err);
      process.exit()
    }
    else {
      console.log(i);
      i++
      cb(null, 'Revision Updated')
    }
  })
}

// EXPORTS
module.exports.insertRevision = insertRevision
module.exports.findRevisionsByArticleTitle = findRevisionsByArticleTitle
module.exports.findOneRevisionsByArticleTitle = findOneRevisionsByArticleTitle
module.exports.findRevisionsByRevID = findRevisionsByRevID
module.exports.updateRevisionByRevID = updateRevisionByRevID
