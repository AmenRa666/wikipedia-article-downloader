"use strict"
// MODULES
const PythonShell = require('python-shell')
const time = require('node-tictoc')
const async = require('async')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const pluralize = require('pluralize')
const nlp = require('nlp_compromise')
const _ = require('underscore')
const difflib = require('difflib')
// Database Agent
const dbAgent = require('./dbAgent.js')


// LOGIC
let endOfLine = require('os').EOL

let articlesFilename = 'Articles.txt'
let articlesFile = fs.readFileSync(articlesFilename, 'utf8')
let articleList = articlesFile.trim().split('\n')
console.log('Articles List: LOADED');

let nodesFilename = 'articlesUsersGraphNodes.txt'
let edgesFilename = 'articlesUsersGraphEdges.txt'

let xmlLayout1 = '<mediawiki>' + endOfLine + '<siteinfo>' + endOfLine + '<sitename>Wikipedia</sitename>' + endOfLine + '</siteinfo>' + endOfLine + '<page>' + endOfLine + '<title></title>' + endOfLine + '<id></id>' + endOfLine + '<revision>' + endOfLine + '<model>wikitext</model>' + endOfLine + '<format>text/x-wiki</format>' + endOfLine + '<text>'

let xmlLayout2 = '</text>' + endOfLine + '</revision>' + endOfLine + '</page>' + endOfLine + '</mediawiki>'

let stopwords = ["a","a's","able","about","above","according","accordingly","across","actually","after","afterwards","again","against","ain't","all","allow","allows","almost","alone","along","already","also","although","always","am","among","amongst","an","and","another","any","anybody","anyhow","anyone","anything","anyway","anyways","anywhere","apart","appear","appreciate","appropriate","are","aren't","around","as","aside","ask","asking","associated","at","available","away","awfully","b","be","became","because","become","becomes","becoming","been","before","beforehand","behind","being","believe","below","beside","besides","best","better","between","beyond","both","brief","but","by","c","c'mon","c's","came","can","can't","cannot","cant","cause","causes","certain","certainly","changes","clearly","co","com","come","comes","concerning","consequently","consider","considering","contain","containing","contains","corresponding","could","couldn't","course","currently","d","definitely","described","despite","did","didn't","different","do","does","doesn't","doing","don't","done","down","downwards","during","e","each","edu","eg","eight","either","else","elsewhere","enough","entirely","especially","et","etc","even","ever","every","everybody","everyone","everything","everywhere","ex","exactly","example","except","f","far","few","fifth","first","five","followed","following","follows","for","former","formerly","forth","four","from","further","furthermore","g","get","gets","getting","given","gives","go","goes","going","gone","got","gotten","greetings","h","had","hadn't","happens","hardly","has","hasn't","have","haven't","having","he","he's","hello","help","hence","her","here","here's","hereafter","hereby","herein","hereupon","hers","herself","hi","him","himself","his","hither","hopefully","how","howbeit","however","i","i'd","i'll","i'm","i've","ie","if","ignored","immediate","in","inasmuch","inc","indeed","indicate","indicated","indicates","inner","insofar","instead","into","inward","is","isn't","it","it'd","it'll","it's","its","itself","j","just","k","keep","keeps","kept","know","known","knows","l","last","lately","later","latter","latterly","least","less","lest","let","let's","like","liked","likely","little","look","looking","looks","ltd","m","mainly","many","may","maybe","me","mean","meanwhile","merely","might","more","moreover","most","mostly","much","must","my","myself","n","name","namely","nd","near","nearly","necessary","need","needs","neither","never","nevertheless","new","next","nine","no","nobody","non","none","noone","nor","normally","not","nothing","novel","now","nowhere","o","obviously","of","off","often","oh","ok","okay","old","on","once","one","ones","only","onto","or","other","others","otherwise","ought","our","ours","ourselves","out","outside","over","overall","own","p","particular","particularly","per","perhaps","placed","please","plus","possible","presumably","probably","provides","q","que","quite","qv","r","rather","rd","re","really","reasonably","regarding","regardless","regards","relatively","respectively","right","s","said","same","saw","say","saying","says","second","secondly","see","seeing","seem","seemed","seeming","seems","seen","self","selves","sensible","sent","serious","seriously","seven","several","shall","she","should","shouldn't","since","six","so","some","somebody","somehow","someone","something","sometime","sometimes","somewhat","somewhere","soon","sorry","specified","specify","specifying","still","sub","such","sup","sure","t","t's","take","taken","tell","tends","th","than","thank","thanks","thanx","that","that's","thats","the","their","theirs","them","themselves","then","thence","there","there's","thereafter","thereby","therefore","therein","theres","thereupon","these","they","they'd","they'll","they're","they've","think","third","this","thorough","thoroughly","those","though","three","through","throughout","thru","thus","to","together","too","took","toward","towards","tried","tries","truly","try","trying","twice","two","u","un","under","unfortunately","unless","unlikely","until","unto","up","upon","us","use","used","useful","uses","using","usually","uucp","v","value","various","very","via","viz","vs","w","want","wants","was","wasn't","way","we","we'd","we'll","we're","we've","welcome","well","went","were","weren't","what","what's","whatever","when","whence","whenever","where","where's","whereafter","whereas","whereby","wherein","whereupon","wherever","whether","which","while","whither","who","who's","whoever","whole","whom","whose","why","will","willing","wish","with","within","without","won't","wonder","would","wouldn't","x","y","yes","yet","you","you'd","you'll","you're","you've","your","yours","yourself","yourselves","z","zero"]

let edgesByUser = {}
let termArticleEdges = []
let termList = []
let userList = []

const getMinOfArray = (array) => {
  return Math.min.apply(null, array);
}

const hashCode = (str) => {
  var hash = 5381,
      i    = str.length

  while(i)
    hash = (hash * 33) ^ str.charCodeAt(--i)

  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
   * integers. Since we want the results to be always positive, convert the
   * signed int to an unsigned by doing an unsigned bitshift. */
  return hash >>> 0;
}




const updateRevision = (revision, cb) => {
  let data = xmlLayout1 + revision.text + xmlLayout2
  let dir = 'tmp'
  let filename = 'text.xml'
  let _path = path.join(dir, filename)
  mkdirp(dir, (err) => {
    if (err) throw err
    else {
      fs.writeFileSync(_path, data)
      let options = {
        args: ['-o', 'tmp', '-q', _path]
      };
      // Run Python script
      PythonShell.run('WikiExtractor.py', options, (err, results) => {
        if (err && JSON.stringify(err.toString()).indexOf('2703') == -1) {
          // throw err
          console.log(revision.text);
          revision.text = ''
          cb(null, revision
        }
        // Load extracted article
        fs.readFile('tmp/AA/wiki_00', 'utf8', (err, extractedArticle) => {
          if (err) throw err
          // Delete surraunding tags (<doc> ...text... <\doc>) obtaining revision's text
          let text = extractedArticle.substring(extractedArticle.indexOf(">") + 1, extractedArticle.length - 7).trim()
          // text = text.replace(/[,;\.:?!()\[\]{}\/]/g, '')
          text = text.replace(/[^a-zA-Z0-9]+/g, ' ')
          text = text.replace(new RegExp('\n', 'g'), ' ')
          text = text.replace(/  +/g, ' ')
          text = text.toLowerCase()
          let array = text.split(' ')
          // make all names singular and verbs in the same form to obtain lexicon
          for (let i = 0; i < array.length; i++) {
            array[i] = pluralize.singular(array[i])
            array[i] = nlp.verb(array[i]).conjugate().infinitive
          }
          array = _.uniq(array)
          // remove stopwords
          stopwords.forEach((stopword) => {
            array = array.filter((word) => {
              return word !== stopword
            })
          })
          revision.text = array.join(' ')
          cb(null, revision)
        })
      })
    }
  })
}

// a1 = current revision, a2 = previous revision
const diff_function = (a1, a2) => {
  let added = []
  let reviewed = []
  for (let i = 0; i < a1.length; i++) {
    let term = hashCode(a1[i] + 'xxx')
    if (termList.indexOf(term) == -1) {
      termList.push(term)
    }
    let element = {
      // add 'xxx' to avoid problems
      term: term,
      index: i,
      distance: 0
    }
    if(a2.indexOf(a1[i]) == -1) {
      added.push(element)
    }
    else {
      reviewed.push(element)
    }
  }
  // compute distances
  for (let i = 0; i < reviewed.length; i++) {
    let distances = []
    for (let j = 0; j < added.length; j++) {
      distances.push(Math.abs(added[j].index - reviewed[i].index))
    }
    reviewed[i].distance = getMinOfArray(distances)
  }
  return [added, reviewed]
};

const extractInfos = (articleTitleAndId, cb) => {
  let articleTitle = articleTitleAndId.substring(articleTitleAndId.indexOf('|'),0).replace(/\\u2215/g, '/').replace(/&#58;/g, ':').replace(/\.xml/, '')
  let articleId = articleTitleAndId.substring(articleTitleAndId.indexOf('|')+1)



  dbAgent.findRevisionsByArticleTitle(articleTitle, (revisions) => {
    if (revisions.length > 0) {
      fs.appendFileSync(nodesFilename, articleId + ',A' + endOfLine)
      console.log(revisions.length);
      // Order revisions desc by timestamp
      revisions.sort(function(a, b) {
        return b.timestamp.getTime() - a.timestamp.getTime()
      })

      // revisions = revisions.slice(0,10)

      async.mapSeries(
        revisions,
        updateRevision,
        (err, res) => {
          // add term-article edges
          revisions[0].text.split(' ').forEach((term) => {
            fs.appendFileSync(edgesFilename, hashCode(term + 'xxx') + ',' + articleId + ',0' + endOfLine)
          })
          // terms of which the author has been found
          let globalAdded = []
          // edges by authors
          edgesByUser = {}
          for (let i = 0; i < revisions.length; i++) {
            // add '666' to avoid problems
            let user = hashCode(revisions[i].user + '666')
            let currentRevision = _.intersection(_.difference(revisions[i].text.split(' '), globalAdded), revisions[0].text.split(' '))
            let terms = []
            if (i == revisions.length-1) {
              currentRevision.forEach((term) => {
                terms.push({
                  // add 'xxx' to avoid problems
                  term: hashCode(term + 'xxx'),
                  distance: 0
                })
              })
            }
            else {
              let previousRevision = revisions[i+1].text.split(' ')
              // If the current revision don't add words to the previous it's not possibile to compute distances so it must be ignored
              let difference = _.difference(currentRevision, previousRevision)
              if (difference.length > 0) {
                let array = diff_function(currentRevision, previousRevision)
                array[0].forEach((element) => {
                  globalAdded.push(element.term)
                })
                terms = _.union(array[0], array[1])
              }
            }
            if(edgesByUser.hasOwnProperty(user)){
              for (let i = 0; i < terms.length; i++) {
                for (let j = 0; j < edgesByUser[user].length; j++) {
                  if (edgesByUser[user][j].term == terms[i].term && edgesByUser[user][j].distance < terms[i].distance) {
                    edgesByUser[user][j] = terms[i]
                  }
                }
              }
            }
            else if (terms.length > 0) {
              if (userList.indexOf(user) == -1) {
                userList.push(user)
              }
              edgesByUser[user] = terms
            }
          }

          for (let key in edgesByUser) {
            for (var i = 0; i < edgesByUser[key].length; i++) {
              fs.appendFileSync(edgesFilename, key + ',' + edgesByUser[key][i].term + ',' + edgesByUser[key][i].distance + endOfLine)
            }
          }

          cb(null, 'Extract Infos')

        }
      )
    }
    else {
      cb(null, 'no revisions')
    }


  })
}

time.tic()

async.eachSeries(
  articleList,
  extractInfos,
  (err, res) => {
    if (err) throw err
    else {

      // Add term nodes
      termList.forEach((term) => {
        fs.appendFileSync(nodesFilename, term + ',W' + endOfLine)
      })
      // Add user nodes
      userList.forEach((user) => {
        fs.appendFileSync(nodesFilename, user + ',U' + endOfLine)
      })

      console.log('- - - - - - - - - - -')
      console.log('All revisions have been computed!')
      console.log('- - - - - - - - - - -')
      console.log('Elasped Time:')
      time.toc()
      process.exit()
    }
  }
)
