# mock current working directory
_cwd = process.cwd
process.cwd = -> _cwd() + '/test'

global.should = require('chai').should()
require('./load')
require('./inject')