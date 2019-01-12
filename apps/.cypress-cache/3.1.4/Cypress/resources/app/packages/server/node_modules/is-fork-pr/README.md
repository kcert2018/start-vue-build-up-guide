# is-fork-pr

> Returns true if CI is building a pull request from a remote fork

[![NPM][npm-icon]][npm-url]

[![Build status][ci-image]][ci-url]
[![CircleCI](https://circleci.com/gh/bahmutov/is-fork-pr.svg?style=svg)](https://circleci.com/gh/bahmutov/is-fork-pr)
[![semantic-release][semantic-image]][semantic-url]
[![standard][standard-image]][standard-url]
[![renovate-app badge][renovate-badge]][renovate-app]

**Supports** Travis CI, Circle v2

## Install

Requires [Node](https://nodejs.org/en/) version 6 or above.

```sh
npm install --save is-fork-pr
```

## Use

```js
const isForkPr = require('is-fork-pr').isForkPr
if (isForkPr()) {
  console.log('building forked PR, no environment vars')
}
```

### CI variables

* [Travis environment variables](https://docs.travis-ci.com/user/environment-variables/)
* [Circle v2 variables](https://circleci.com/docs/2.0/env-vars/)

### Small print

Author: Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt; &copy; 2018

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](https://glebbahmutov.com)
* [blog](https://glebbahmutov.com/blog)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/is-fork-pr/issues) on Github

## MIT License

Copyright (c) 2018 Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt;

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

[npm-icon]: https://nodei.co/npm/is-fork-pr.svg?downloads=true
[npm-url]: https://npmjs.org/package/is-fork-pr
[ci-image]: https://travis-ci.org/bahmutov/is-fork-pr.svg?branch=master
[ci-url]: https://travis-ci.org/bahmutov/is-fork-pr
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com/
[renovate-badge]: https://img.shields.io/badge/renovate-app-blue.svg
[renovate-app]: https://renovateapp.com/
