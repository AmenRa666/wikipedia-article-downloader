const pluralize = require('pluralize')
const nlp = require('nlp_compromise')

console.log(pluralize.singular('single'))
console.log(nlp.verb('home').conjugate().infinitive);
