describe 'Inject Configs', (done) ->
  it 'should inject any varible', (done) ->
    process.env.NODE_ENV = 'staging'
    process.env.PORT = 4000
    process.env.MONGO_URL = 'mongodb://10.0.0.10:1234'
    config = require('../src')()
    delete process.env.NODE_ENV
    config.app.port.should.equal(4000)
    config.mongo.url.should.equal('mongodb://10.0.0.10:1234')
    done()