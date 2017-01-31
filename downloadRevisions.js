"use strict"
// MODULES
const fs = require('fs')
const time = require('node-tictoc')
const curl = require('curlrequest')
const xml2js = require('xml2js')
const path = require('path')
const async = require('async')
const mkdirp = require('mkdirp')
const _ = require('underscore')
// Database Agent
const dbAgent = require('./dbAgent.js')
// XML Parser
const parser = new xml2js.Parser()


// LOGIC
let botsFilename = 'Bots.txt'
let botsFile = fs.readFileSync(botsFilename, 'utf8')
let bots = _.uniq(botsFile.trim().split(/[\n,\|]/))
console.log('Bots List: LOADED');

let articleListFilename = 'Articles.txt'
let articleList = fs.readFileSync(articleListFilename, 'utf8').trim().split('\n')
console.log('Articles List: LOADED');

// Starting value
let offset = '1'
let limit = '100'

let noMoreRevisions = false
let articleCount = 0

const saveRevision = (revision, cb) => {
  dbAgent.findRevisionsByRevID(revision.revid, (revisions) => {
    if (revisions.length == 0) {
      dbAgent.insertRevision(revision, cb)
    }
    else {
      console.log('Revision found in DB');
      cb(null, 'Revision found in DB')
    }
  })
}

const saveRevisions = (revisions, cb) => {
  async.each(
    revisions,
    saveRevision,
    (err, res) => {
      if (err) throw err
      else {
        console.log('- - - - - - - - - - -');
        cb(null, 'Save Revisions')
      }
    }
  )
}

const revisionsPreprocessing = (articleTitle, revisionsFromXML, cb) => {
  let revisions = []
  for (let i = 0; i < revisionsFromXML.length; i++) {
    // Check that contributor is not a bot
    let notBot = false
    if (
      (( revisionsFromXML[i].contributor[0].username &&
      revisionsFromXML[i].contributor[0].username[0].toLowerCase().indexOf('bot') < 0 &&
      bots.indexOf(revisionsFromXML[i].contributor[0].username[0]) < 0 ) ||
      ( revisionsFromXML[i].contributor[0].ip &&
      bots.indexOf(revisionsFromXML[i].contributor[0].ip[0]) < 0 )) &&
      revisionsFromXML[i].text[0]._ &&
      revisionsFromXML[i].timestamp[0] &&
      revisionsFromXML[i].id[0]
    ) {
      notBot = true
    }
    if (notBot) {
      // Check that the revision is the last revision in a series by the same contributor
      let push = false
      if (revisionsFromXML[i+1] == undefined) {
        push = true
      }
      else if (
        revisionsFromXML[i].contributor[0].username &&
        revisionsFromXML[i+1].contributor[0].username &&
        revisionsFromXML[i].contributor[0].username[0] != revisionsFromXML[i+1].contributor[0].username[0]
      ) {
        push = true
      }
      else if (
        revisionsFromXML[i].contributor[0].ip &&
        revisionsFromXML[i+1].contributor[0].ip &&
        revisionsFromXML[i].contributor[0].ip[0] != revisionsFromXML[i+1].contributor[0].ip[0]
      ) {
        push = true
      }
      else if (
        ( revisionsFromXML[i].contributor[0].username &&
        !revisionsFromXML[i+1].contributor[0].username ) ||
        ( !revisionsFromXML[i].contributor[0].username &&
        revisionsFromXML[i+1].contributor[0].username )
      ) {
        push = true
      }
      if (push) {
        let revision = {
          articleTitle: articleTitle,
          revid: revisionsFromXML[i].id[0],
          timestamp: revisionsFromXML[i].timestamp[0],
          user: null,
          text: revisionsFromXML[i].text[0]._,
        }
        if (revisionsFromXML[i].contributor[0].username) {
          revision.user = revisionsFromXML[i].contributor[0].username[0].replace(/ /g, '_')
        }
        else {
          revision.user = revisionsFromXML[i].contributor[0].ip[0]
        }
        revisions.push(revision)
      }
    }
  }
  saveRevisions(revisions, cb)
}

const downloadRevisions = (articleTitle, cb) => {
  let url = 'https://en.wikipedia.org/w/index.php?title=Special:Export&pages=' + articleTitle + '&offset=' + offset +  '&limit=' + limit + '&action=submit'
  url = url.replace(/&#58;/g, ':')
  let options = {
    url: url,
    method: 'POST'
  }
  curl.request(options, (err, parts) => {
    if (err) throw err
    else {
      parts = parts.split('\r\n')
      // let data = parts.pop()
      let data = parts
      let dir = 'tmp'
      let filename = 'text.xml'
      let _path = path.join(dir, filename)
      mkdirp(dir, (err) => {
        if (err) throw err
        else {
          fs.writeFileSync(_path, data)
          let xmlHistory = fs.readFileSync(_path, 'utf8')
          parser.parseString(xmlHistory, (err, res) => {
            if (err) throw err
            else if (res.mediawiki.page) {
              console.log('Revisions retrieved:', res.mediawiki.page[0].revision.length);
              let revisionsFromXML = res.mediawiki.page[0].revision
              let lastRevision = revisionsFromXML[revisionsFromXML.length - 1]
              offset = lastRevision.timestamp[0]
              revisionsPreprocessing(articleTitle, revisionsFromXML, cb)
            }
            else {
              noMoreRevisions = true
              cb(null, 'End Download Revisions')
            }
          })
        }
      })
    }
  })
}

const downloadArticleRevisions = (articleTitle, cb) => {
  console.log('- - - - - - - - - - -');
  console.log(articleTitle);
  console.log('- - - - - - - - - - -');
  let _articleTitle = articleTitle.trim()
  // dbAgent.findRevisionsByArticleTitle(_articleTitle, (revisions) => {
    // if (revisions.length == 0) {
      async.whilst(
          () => { return !noMoreRevisions },
          async.apply(downloadRevisions, _articleTitle),
          (err, res) => {
            if (err) throw err
            else {
              articleCount++
              console.log(articleCount + ' - All revisions of ' + _articleTitle + ' have been downloaded!');
              noMoreRevisions = false
              offset = 1
              cb( null, 'Download Article Revisions')
            }
          }
      )
    // }
    // else {
      // articleCount++
      // console.log(articleCount + " - Article's revisions already downloaded!");
      // cb( null, 'Download Article Revisions')
    // }
  // })
}

time.tic()

async.eachSeries(
  articleList,
  downloadArticleRevisions,
  (err, res) => {
    if (err) throw err
    else {
      console.log('- - - - - - - - - - -')
      console.log('All revisions have been retrieved!')
      console.log('- - - - - - - - - - -')
      console.log('Elasped Time:')
      time.toc()
      process.exit()
    }
  }
)

// INTRODUCED SECOND DB
// Siege_of_Calais_(1940)
