"use strict"
// MODULES
const fs = require('fs')
const path = require('path')
const _ = require('underscore')
const inspect = require('util').inspect
const time = require('node-tictoc')
const async = require('async')


// LOGIC
let endOfLine = require('os').EOL

let dir = 'User Article Graph'
let paths = [
  'A Graph',
  'B Graph',
  'C Graph',
  'FA Graph',
  'GA Graph',
  'R Graph',
  'Start Graph',
  'STUB Graph'
]

let edgesFilename = 'articlesUsersGraphEdges.txt'
let nodesFilename = 'articlesUsersGraphNodes.txt'

let edges = []

// const concatEdges = (p, cb) => {
  let _path = path.join(dir, edgesFilename)

  let j = 0

  let buffer = '';
  let rs = fs.createReadStream(_path)
  rs.on('data', (chunk) => {
    let lines = (buffer + chunk).split(/\r?\n/g);
    // buffer = lines.pop();
    for (let i = 0; i < lines.length; ++i) {
      // edges.push(lines[i])
      j++
    }
  });
  rs.on('end', () => {
    console.log(j);
    // console.log(edges.length);
    // cb(null, 'concatEdges')
    // console.log('ended on non-empty buffer: ' + inspect(buffer));
  });
// }

// time.tic()
//
// async.eachSeries(
//   paths,
//   concatEdges,
//   (err, res) => {
//     if (err) throw err
//     else {
//       edges = _.uniq(edges)
//       edges.forEach((edge) => {
//         fs.appendFileSync('./articlesUsersGraphEdges.txt', edge + '\n', 'utf-8')
//       })
//       console.log(edges.length);
//       console.log('- - - - - - - - - -');
//       console.log('END');
//       console.log('Elapsed time: ');
//       time.toc()
//     }
//   }
// )
