"use strict"
// MODULES
const request = require('request')
const fs = require('fs')
const time = require('node-tictoc')
const curl = require('curlrequest')
const xml2js = require('xml2js')
const path = require('path')
const async = require('async')
const mkdirp = require('mkdirp')
// Database Agent
const dbAgent = require('./dbAgent.js')
// XML Parser
const parser = new xml2js.Parser()


// LOGIC
let title = 'Robert_E._Lee'

let date = '2011-11-30T18:31:19.000Z'

let url = 'https://en.wikipedia.org/w/index.php?title=Special:Export&pages=' + title + '&offset=' + date +  '&limit=10&action=submit'


let options = {
  url: url,
  method: 'POST'
}

time.tic()

// curl.request(options, (err, parts) => {
//   if (err) throw err
//   else {
//     parts = parts.split('\r\n')
//     let data = parts.pop()
//
//     let dir = 'tmp'
//     let filename = 'text.xml'
//     let _path = path.join(dir, filename)
//
//     mkdirp(dir, (err) => {
//       if (err) throw err
//       else {
//         // fs.writeFile(path.join(dir, filename), data, (err) => {
//         //   if (err) throw err
//         //   else {
//         //     cb(null, 'Download Revision')
//         //   }
//         // })
//         fs.writeFileSync(_path, data)
//
//         console.log('saved');
//
//         let xmlHistory = fs.readFileSync(_path, 'utf8')
//
//         parser.parseString(xmlHistory, (err, res) => {
//           if (err) throw err
//           else {
//
//             console.log('parsed');
//             console.log(res.mediawiki.page[0].revision.length);
//
//             time.toc()
//             process.exit()
//           }
//         })
//       }
//     })
//   }
// })



let dir = 'tmp'
let filename = 'text.xml'
let _path = path.join(dir, filename)

let xmlHistory = fs.readFileSync(_path, 'utf8')

parser.parseString(xmlHistory, (err, res) => {
  if (err) throw err
  else {

    console.log('parsed');
    let revisionsFromXML = res.mediawiki.page[0].revision
    let revisions = []

    revisionsFromXML.forEach((rev) => {
      let revision = {
        revid: null,
        timestamp: null,
        user: null,
        text: ''
      }
      
      console.log(rev.id[0]);
      console.log(rev.timestamp[0]);
      console.log(rev.contributor[0]);
      console.log('- - - - - - -');
    })

    time.toc()
    process.exit()
  }
})
