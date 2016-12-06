"use strict"
// MODULES
const request = require('request')
const mkdirp = require('mkdirp')
const qs = require('querystring')
const fs = require('fs')
const async = require('async')
const path = require('path')
const time = require('node-tictoc')
const xml2js = require('xml2js')
const curl = require('curlrequest')
// Database Agent
const dbAgent = require('./dbAgent.js')
// XML Parser
const parser = new xml2js.Parser()


// let xmlHistory = fs.readFileSync('text.xml', 'utf8')
//
// parser.parseString(xmlHistory, (err, res) => {
//       if (err) throw err
//       res.article.revision.push('dioporco')
//       console.log(console.log(res))
// })


// LOGIC
let title = "Clansman"
// let offset = "20100809003006"

// let date = new Date(2006, 6, 16, 10, 19)




// Starting value (set before Wikipedia was born)
// let date = '2000-01-01T00:00:00Z'


// let url = 'https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=' + title + '&rvprop=timestamp%7Cuser%7Ccontent'

// const url = 'https://en.wikipedia.org/wiki/Special:Export/'



time.tic()

let page = {
  title: null,
  id: null,
  revisions: []
}

// let revision = {
//   revid: null,
//   timestamp: null,
//   user: null,
//   text: null
// }

let dates = ['2011-11-30T18:31:19.000Z']

// dbAgent.findRevisionByArticleTitle(title, (revisions) => {
//   revisions.forEach((revision) => {
//     dates.push(revision.timestamp)
//   })
//   console.log(dates);
//
// })

const downloadRevision = (date, cb) => {
  let url = 'https://en.wikipedia.org/w/index.php?title=Special:Export&pages=' + title + '&offset=' + date +  '&limit=1&action=submit'

  let options = {
    url: url,
    method: 'POST'
  }

  curl.request(options, (err, parts) => {
    if (err) throw err
    else {
      parts = parts.split('\r\n')
      let data = parts.pop()
      let filename = date.replace(/:/g, '-') + '.xml'
      let dir = 'revisions'

      mkdirp(dir, (err) => {
        if (err) throw err
        else {
          fs.writeFile(path.join(dir, filename), data, (err) => {
            if (err) throw err
            else {
              cb(null, 'Download Revision')
            }
          })
        }
      })


    }
    // console.log(data);
  })
}

async.each(
  dates,
  downloadRevision,
  (err, res) => {
    console.log('ALL');
    time.toc()
    process.exit()
  }
)



request(url, (error, response, body) => {
  console.log('OK');
  if (!error && response.statusCode == 200) {

    time.toc()

    fs.writeFileSync('test.xml', body)
    console.log('saved');

    let xmlHistory = fs.readFileSync('test.xml', 'utf8')

    parser.parseString(xmlHistory, (err, res) => {
          if (err) throw err




          // version.page.push([res.mediawiki.page[0].revision[0]])


          //  console.log(version);
          //
          // let revisionsFromXML = res.mediawiki.page[0]
          // let revisions = []
          //
          // console.log(revisionsFromXML.length);
          //
          // console.log('id', revisionsFromXML[0].id[0]);
          // console.log('timestamp', revisionsFromXML[0].timestamp[0]);
          // console.log('text', revisionsFromXML[0].text[0]);

          for (let i = 0; i < revisionsFromXML.length; i++) {

            let revision = {
              revid: null,
              timestamp: null,
              user: null,
              text: ''
            }

            if (revisionsFromXML[i].contributor[0].username) {
              revision.user = revisionsFromXML[i].contributor[0].username[0]
            }
            else {
              revision.user = revisionsFromXML[i].contributor[0].ip[0]
            }




            // if (revisionsFromXML[i+1] == undefined) {
            //   revisions.push(revisionsFromXML[i])
            // }
            // else if (revisionsFromXML[i].contributor != revisionsFromXML[i+1].contributor) {
            //   revisions.push(revisionsFromXML[i])
            // }
          }




          process.exit()
    })



  }
  else {
    console.log('- - - - - - - - - -');
    console.log(error);
    console.log(response.statusCode);
    process.exit()
  }
})


// console.log(decodeURIComponent("Days_N'_Daze"));
