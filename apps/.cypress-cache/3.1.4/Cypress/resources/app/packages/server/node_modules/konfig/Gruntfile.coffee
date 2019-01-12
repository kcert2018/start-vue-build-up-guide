module.exports = (grunt) ->
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

  grunt.initConfig
    coffee:
      'lib/index.js': 'src/index.coffee'

  grunt.registerTask('default', ['coffee'])