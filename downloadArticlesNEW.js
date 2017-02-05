"use strict"
// MODULES
const request = require('request')
const mkdirp = require('mkdirp')
const qs = require('querystring')
const fs = require('fs')
const async = require('async')
const path = require('path')
const _ = require('underscore')
const time = require('node-tictoc')


// LOGIC
let endOfLine = require('os').EOL

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

const category = 'military_history_articles'

const datasetPath = 'dataset'

const pathXML = path.join(datasetPath, 'articlesXML')
const pathClasses = ['featuredArticles', 'aClassArticles', 'goodArticles', 'bClassArticles', 'cClassArticles', 'startArticles', 'stubArticles']

const pathTalkPageXML = path.join(datasetPath, 'talkPagesXML')

const pathLists = path.join(datasetPath, 'articlesLists')
const lists = ['featuredArticles.txt', 'aClassArticles.txt', 'goodArticles.txt', 'bClassArticles.txt', 'cClassArticles.txt', 'startArticles.txt', 'stubArticles.txt']

const classes = ['fa', 'a', 'ga', 'b', 'c', 'start', 'stub']

let index = 0
let j = 1

// let articlesList = fs.readFileSync('./dataset/articlesLists/cClassArticles.txt', 'utf-8')
// let articles = _.uniq(articlesList.trim().split(new RegExp(endOfLine)))
let articles = []

const writeList = (title, cb) => {
  // REPLACE SLASH and COLON
  let _title = title.replace(/\//g, '\u2215').replace(/:/g, '&#58;')
  let list = path.join(pathLists, lists[index])
  mkdirp(pathLists, (err) => {
    if (err) throw err
    fs.appendFileSync(list, _title + '\n')
    cb(null, 'Article Saved in List')
  })
}

const writeFile = (folder, title, contents, cb) => {
  // REPLACE SLASH and COLON
  let _title = title.replace(/\//g, '\u2215').replace(/:/g, '&#58;')
  let _path = path.join(folder, pathClasses[index])
  mkdirp(_path, (err) => {
    if (err) throw err
    _path = path.join(folder, pathClasses[index], (_title + '.xml'))
    fs.writeFileSync(_path, contents)
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

      let talkPage = body.toLowerCase().replace(/ /g, '').replace(new RegExp(endOfLine, 'g'), '').replace(/}}/g, endOfLine)

      let boolean = false

      let _class = classes[index]

      if (talkPage.search(new RegExp('wikiprojectmilitaryhistory.*(?=class=' + _class + ')')) > -1) {
        boolean = true
      }
      else if (talkPage.search(new RegExp('wikiprojectmilitaryhistory.*(?=' + _class + '-class=pass)')) > -1) {
        boolean = true
      }
      else if (talkPage.search(new RegExp('wpmilitaryhistory.*(?=class=' + _class + ')')) > -1) {
        boolean = true
      }
      else if (talkPage.search(new RegExp('wpmilitaryhistory.*(?=' + _class + '-class=pass)')) > -1) {
        boolean = true
      }
      else if (talkPage.search(new RegExp('milhist.*(?=class=' + _class + ')')) > -1) {
        boolean = true
      }
      else if (talkPage.search(new RegExp('milhist.*(?=' + _class + '-class=pass)')) > -1) {
        boolean = true
      }
      else if (talkPage.search(new RegExp('wpmilhist.*(?=class=' + _class + ')')) > -1) {
        boolean = true
      }
      else if (talkPage.search(new RegExp('wpmilhist.*(?=' + _class + '-class=pass)')) > -1) {
        boolean = true
      }

      if (boolean) {
        writeFile(pathTalkPageXML, title, body, cb)
      }
      else {
        cb('Wrong class: ' + title, null)
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

const downloadXML = (title, cb) => {
  if (articles.indexOf(title.replace(/\//g, '\u2215').replace(/:/g, '&#58;')) > 0) {
    console.log('Article already downloaded: ' + title);
    console.log('- - - - - - - - - -');
    cb(null, 'Article already downloaded')
  }
  else {
    let regex = /^[a-zA-Z0-9!@#£\$%\^\&*\)\(+=._-\s:,]+$/g
    if (!regex.test(title) || title[0] == '.' || title.indexOf(category) > -1) {
      cb(null, 'Article downloaded')
    }
    else {
      let urlXML = specialExportUrl + title
      request(urlXML, (error, response, body) => {
        console.log('Download XML: OK');
        if (!error && response.statusCode == 200) {
          downloadTalkPage(title, (err, res) => {
            if (err) {
              console.log(err);
              console.log('- - - - - - - - - -');
              cb(null, 'Wrong class')
            }
            else {
              console.log('talk page ok');
              async.series([
                async.apply(writeFile, pathXML, title, body),
                async.apply(writeList, title),
              ], (err, res) => {
                console.log('- - - - - - - - - -');
                articles.push(title)
                j++
                cb(null, 'Article downloaded')
              })
            }
          })
        }
        else {
          console.log('- - - - - - - - - -');
          console.log(error);
          console.log(response.statusCode);
          cb('Error downloading: ' + title, null)
        }
      })
    }
  }
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

const downloadArticles = (classUrl, cb) => {
  async.whilst(
    () => { return articles.length < 400; },
    getRandomArticle,
    (err) => {
      if (err) throw err
      console.log('- - - - - - - - - - - - - - - - - - - -');
      articles = []
      index++
      process.exit()
      cb(null, 'Download 100 Articles')
    }
  )
}

time.tic()

async.eachSeries(
  classUrls,
  downloadArticles,
  (err, res) => {
    if (err) throw err
    console.log('All articles have been downloaded!');
    console.log('Time elapsed: ');
    time.toc()
    process.exit()
  }
)
