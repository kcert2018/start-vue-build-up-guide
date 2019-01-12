describe 'Load Configs', ->
  it 'should load json files correctly', (done) ->
    config = require('../src')()
    should.exist(config.app)
    done()

  it 'should load yaml files correctly', (done) ->
    config = require('../src')()
    should.exist(config.mongo)
    done()

  it 'should load yml files correctly', (done) ->
    config = require('../src')()
    should.exist(config.twitter)
    done()

  it 'should load cson files correctly', (done) ->
    config = require('../src')()
    should.exist(config.csonconfig)
    done()

  it 'should load cson file by environment', (done) ->
    process.env.NODE_ENV = 'production'
    config = require('../src')()
    delete process.env.NODE_ENV
    config.csonconfig.a.should.equal(123)
    config.csonconfig.b.should.equal(3456)
    done()

  it 'should not load other files', (done) ->
    config = require('../src')()
    should.not.exist(config.rabbit)
    done()

  it 'should replace extra dots to underscore', (done) ->
    config = require('../src')()
    should.exist(config.solr_server_conf)
    done()

  it 'should load development configs without NODE_ENV variable', (done) ->
    config = require('../src')()
    config.app.name.should.be.equal('Test Development')
    config.app.features.merge.should.be.equal("Y")
    config.app.features.extend.should.be.equal("Y")
    config.app.port.should.be.equal(3000)
    done()

  it 'should load production configs if NODE_ENV is production', (done) ->
    process.env.NODE_ENV = 'production'
    config = require('../src')()
    delete process.env.NODE_ENV
    config.app.name.should.equal('Test App')
    config.app.port.should.equal(3001)
    done()

  it 'should allow deep merging on config variables between default and the environment', (done) ->
    process.env.NODE_ENV = 'production'
    config = require('../src')()
    delete process.env.NODE_ENV
    config.app.name.should.equal('Test App')
    config.app.features.merge.should.be.equal("N")
    config.app.features.extend.should.be.equal("Y")
    done()

  it 'should load correct folder if options.path exists', (done) ->
    config = require('../src')(path: './other_configs')
    config.redis.port.should.equal(6379)
    should.not.exist(config.app)
    should.not.exist(config.mongo)
    done()

  it 'should load correct folder if options.path is full path', (done) ->
    config = require('../src')(path: require('path').resolve('./other_configs'))
    done()

  it 'should load correct folder if options.path exists and env is production', (done) ->
    process.env.NODE_ENV = 'production'
    config = require('../src')(path: './other_configs')
    delete process.env.NODE_ENV
    config.redis.port.should.equal(6378)
    done()

  it 'should load defauls values if config doesnt have env', (done) ->
    config = require('../src')()
    config.twitter.consumer_key.should.equal('twitter_consumer_key')
    config.twitter.consumer_secret.should.equal('twitter_secret_key')
    done()

  it 'should override default values if there is yaml inheritance', (done) ->
    config = require('../src')()
    config.mongo.database.should.equal('test_dev')
    config.mongo.pool.should.equal(3)
    done()