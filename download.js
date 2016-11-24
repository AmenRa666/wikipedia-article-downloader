"use strict"
// MODULES
const request = require('request')
const mkdirp = require('mkdirp')
const qs = require('querystring')
const fs = require('fs')
const async = require('async')
const path = require('path')
var time = require('node-tictoc')


// LOGIC
const randomArticleByCategoryUrl = 'https://en.wikipedia.org/wiki/Special:RandomInCategory/'
const specialExportUrl = 'https://en.wikipedia.org/wiki/Special:Export/'

const classUrls = [
  'FA-Class_',
  'A-Class_',
  'GA-Class_',
  'B-Class_',
  'C-Class_',
  'Start-Class_',
  'Stub-Class_',
]
// const categories = [
//   'biography_(military)_articles',
//   'united_states_military_history_articles',
//   'biography_articles',
//   'north_american_military_history_articles',
//   'military_history_articles'
// ]

const category = 'military_history_articles'

const datasetPath = 'dataset/'

const pathXML = datasetPath + 'articlesXML/'
const pathClasses = ['featuredArticles/', 'aClassArticles/', 'goodArticles/', 'bClassArticles/', 'cClassArticles/', 'startArticles/', 'stubArticles/']

const pathTalkPageXML = datasetPath + 'talkPagesXML/'

const pathLists = datasetPath + 'articlesLists/'
const lists = ['featuredArticles.txt', 'aClassArticles.txt', 'goodArticles.txt', 'bClassArticles.txt', 'cClassArticles.txt', 'startArticles.txt', 'stubArticles.txt']

let index = 0
let articleCount = 0
let j = 1

let articles = []

let faArticles = []
let aArticles = []
let gaArticles = []
let bArticles = []
let cArticles = []
let startArticles = []
let stubArticles = []

const writeList = (title, cb) => {
  // REPLACE SLASH and COLON
  title =  decodeURI(title).replace(/\//g, '\u2215').replace(/:/g, '&#58;')
  let list = pathLists + lists[index]
  mkdirp(pathLists, (err) => {
    if (err) throw err
    fs.appendFileSync(list, title + '\n')
    articleCount++
    cb(null, 'Article Saved in List')
  })
}

const writeFile = (path, title, contents, cb) => {
  // REPLACE SLASH and COLON
  title =  decodeURI(title).replace(/\//g, '\u2215').replace(/:/g, '&#58;')
  mkdirp(path + pathClasses[index], (err) => {
    if (err) throw err
    fs.writeFileSync(path + pathClasses[index] + title + '.xml', contents)
    articles.push(title)
    console.log(j +' SAVED: '+ title);
    cb(null, 'Article Saved')
  })
}

const downloadTalkPage = (title, cb) => {
  title = 'Talk:' + title
  let urlTalkPage = specialExportUrl + title
  request(urlTalkPage, (error, response, body) => {
    console.log('Download Talk Page: OK');
    if (!error && response.statusCode == 200) {
      let path = pathTalkPageXML
      writeFile(path, title, body, cb)
    }
    else {
      console.log('- - - - - - - - - -');
      console.log(error);
      console.log(response.statusCode);
      cb('Error downloading: ' + title, null)
    }
  })
}

const downloadXML = (title, cb) => {
  // let urlXML = 'https://en.wikipedia.org/wiki/Special:Export/Ph%E1%BA%A1m_Ng%E1%BB%8Dc_Th%E1%BA%A3o'

  let urlXML = specialExportUrl + title

  request(urlXML, (error, response, body) => {
    console.log('Download XML: OK');
    if (!error && response.statusCode == 200) {
      if (articles.indexOf(title) > 0) {
        console.log('Article already downloaded: ' + title);
        console.log('- - - - - - - - - -');
        cb(null, 'Article already downloaded')
      }
      else {
        let path = pathXML
        async.series([
          async.apply(writeFile, path, title, body),
          async.apply(writeList, title),
          async.apply(downloadTalkPage, title)
        ], (err, res) => {
          console.log('- - - - - - - - - -');
          j++
          cb(null, 'Article downloaded')
        })
      }
    }
    else {
      console.log('- - - - - - - - - -');
      console.log(error);
      console.log(response.statusCode);
      cb('Error downloading: ' + title, null)
    }
  })
}

const getRandomArticle = (cb) => {
  let url = randomArticleByCategoryUrl + classUrls[index] + category
  request(url, (error, response, body) => {
    console.log('Random Article: OK');
    if (!error && response.statusCode == 200) {
      let pathname = response.request.uri.pathname
      let title = pathname.substring(11, pathname.length)
      downloadXML(title, cb)
    }
    else {
      console.log('- - - - - - - - - -');
      console.log(error);
      console.log(response.statusCode);
      cb('Error downloading: ' + title, null)
    }
  })
}

const download100Articles = (_class, cb) => {
  async.whilst(
    () => { return articleCount < 400; },
    getRandomArticle,
    (err) => {
      if (err) throw err
      console.log('- - - - - - - - - - - - - - - - - - - -');
      articleCount = 0
      index++
      cb(null, 'Download 100 Articles')
    }
  )
}

time.tic()

async.eachSeries(
  classUrls,
  download100Articles,
  (err, res) => {
    if (err) throw err
    console.log('All articles have been downloaded!');
    console.log('Time elapsed: ');
    time.toc()
    process.exit()
  }
)




// async.series([
//   async.apply(writeFile, path, sanitizedTitle, body),
//   async.apply(writeList, sanitizedTitle),
//   async.apply(downloadTalkPage, title)
// ])


// const one = (x, cb) => {
//     console.log(x);
//     writeList('yo', cb)
//     // cb()
// }
//
// const two = (y, cb) => {
//     console.log(y);
//     cb()
// }
//
// async.series([
//   async.apply(writeFile, './', 'sanitizedTitle', 'body'),
//   async.apply(writeList, 'one'),
//   async.apply(downloadTalkPage, 'dioboia')
// ])
