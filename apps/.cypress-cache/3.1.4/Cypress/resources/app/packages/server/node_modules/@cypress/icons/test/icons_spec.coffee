icons  = require("../index")
expect = require("chai").expect

cwd = process.cwd()

describe "Cypress Icons", ->
  it "returns path to favicon", ->
    expect(icons.getPathToFavicon("favicon-red.ico")).to.eq(cwd + "/dist/favicon/favicon-red.ico")

  it "returns path to tray", ->
    expect(icons.getPathToTray("mac-normal-inverse.png")).to.eq(cwd + "/dist/tray/mac-normal-inverse.png")

  it "returns path to icon", ->
    expect(icons.getPathToIcon("cypress.icns")).to.eq(cwd + "/dist/icons/cypress.icns")

  it "returns path to logo", ->
    expect(icons.getPathToLogo("cypress-bw.png")).to.eq(cwd + "/dist/logo/cypress-bw.png")