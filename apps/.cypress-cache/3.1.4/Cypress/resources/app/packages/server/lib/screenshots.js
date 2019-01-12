(function() {
  var Jimp, Promise, RUNNABLE_SEPARATOR, _, __ID__, captureAndCheck, clearMultipartState, colorString, crop, dataUriToBuffer, debug, ensureUniquePath, fs, getBuffer, getDimensions, getPath, getPathToScreenshot, getType, glob, hasHelperPixels, imagesMatch, intToRGBA, invalidCharsRe, isAppOnly, isBlack, isMultipart, isWhite, lastImagesAreDifferent, mime, multipartConditionFn, multipartImages, path, pathHelpers, pathSeparatorRe, pixelConditionFn, plugins, replaceInvalidChars, sizeOf, stitchScreenshots,
    slice = [].slice;

  _ = require("lodash");

  mime = require("mime");

  path = require("path");

  Promise = require("bluebird");

  dataUriToBuffer = require("data-uri-to-buffer");

  Jimp = require("jimp");

  sizeOf = require("image-size");

  colorString = require("color-string");

  debug = require("debug")("cypress:server:screenshot");

  plugins = require("./plugins");

  fs = require("./util/fs");

  glob = require("./util/glob");

  pathHelpers = require("./util/path_helpers");

  RUNNABLE_SEPARATOR = " -- ";

  pathSeparatorRe = /[\\\/]/g;

  invalidCharsRe = /[^0-9a-zA-Z-_\s\(\)]/g;

  __ID__ = null;

  replaceInvalidChars = function(str) {
    return str.replace(invalidCharsRe, "");
  };

  debug = _.wrap(debug, function() {
    var args, fn, str;
    fn = arguments[0], str = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
    return fn.apply(null, ["(" + __ID__ + ") " + str].concat(slice.call(args)));
  });

  isBlack = function(rgba) {
    return ("" + rgba.r + rgba.g + rgba.b) === "000";
  };

  isWhite = function(rgba) {
    return ("" + rgba.r + rgba.g + rgba.b) === "255255255";
  };

  intToRGBA = function(int) {
    var obj;
    obj = Jimp.intToRGBA(int);
    if (debug.enabled) {
      obj.name = colorString.to.keyword([obj.r, obj.g, obj.b]);
    }
    return obj;
  };

  hasHelperPixels = function(image, pixelRatio) {
    var bottomLeft, bottomRight, topLeft, topLeftDown, topLeftRight, topRight;
    topLeft = intToRGBA(image.getPixelColor(0, 0));
    topLeftRight = intToRGBA(image.getPixelColor(1 * pixelRatio, 0));
    topLeftDown = intToRGBA(image.getPixelColor(0, 1 * pixelRatio));
    bottomLeft = intToRGBA(image.getPixelColor(0, image.bitmap.height));
    topRight = intToRGBA(image.getPixelColor(image.bitmap.width, 0));
    bottomRight = intToRGBA(image.getPixelColor(image.bitmap.width, image.bitmap.height));
    topLeft.isNotWhite = !isWhite(topLeft);
    topLeftRight.isWhite = isWhite(topLeftRight);
    topLeftDown.isWhite = isWhite(topLeftDown);
    bottomLeft.isWhite = isWhite(bottomLeft);
    topRight.isWhite = isWhite(topRight);
    bottomRight.isBlack = isBlack(bottomRight);
    debug("helper pixels \n %O", {
      topLeft: topLeft,
      topLeftRight: topLeftRight,
      topLeftDown: topLeftDown,
      bottomLeft: bottomLeft,
      topRight: topRight,
      bottomRight: bottomRight
    });
    return topLeft.isNotWhite && topLeftRight.isWhite && topLeftDown.isWhite && bottomLeft.isWhite && topRight.isWhite && bottomRight.isBlack;
  };

  captureAndCheck = function(data, automate, conditionFn) {
    var attempt, start, tries;
    start = new Date();
    tries = 0;
    return (attempt = function() {
      var takenAt, totalDuration;
      tries++;
      totalDuration = new Date() - start;
      debug("capture and check %o", {
        tries: tries,
        totalDuration: totalDuration
      });
      takenAt = new Date().toJSON();
      return automate(data).then(function(dataUrl) {
        debug("received screenshot data from automation layer", dataUrl.slice(0, 100));
        return Jimp.read(dataUriToBuffer(dataUrl));
      }).then(function(image) {
        debug("read buffer to image " + image.bitmap.width + " x " + image.bitmap.height);
        if ((totalDuration > 1500) || conditionFn(data, image)) {
          debug("resolving with image %o", {
            tries: tries,
            totalDuration: totalDuration
          });
          return {
            image: image,
            takenAt: takenAt
          };
        } else {
          return attempt();
        }
      });
    })();
  };

  isAppOnly = function(data) {
    return data.capture === "viewport" || data.capture === "fullPage";
  };

  isMultipart = function(data) {
    return _.isNumber(data.current) && _.isNumber(data.total);
  };

  crop = function(image, dimensions, pixelRatio) {
    var height, width, x, y;
    if (pixelRatio == null) {
      pixelRatio = 1;
    }
    debug("dimensions before are %o", dimensions);
    dimensions = _.transform(dimensions, function(result, value, dimension) {
      return result[dimension] = value * pixelRatio;
    });
    debug("dimensions for cropping are %o", dimensions);
    x = Math.min(dimensions.x, image.bitmap.width - 1);
    y = Math.min(dimensions.y, image.bitmap.height - 1);
    width = Math.min(dimensions.width, image.bitmap.width - x);
    height = Math.min(dimensions.height, image.bitmap.height - y);
    debug("crop: from " + x + ", " + y);
    debug("        to " + width + " x " + height);
    return image.clone().crop(x, y, width, height);
  };

  pixelConditionFn = function(data, image) {
    var app, hasPixels, passes, pixelRatio, subject;
    pixelRatio = image.bitmap.width / data.viewport.width;
    hasPixels = hasHelperPixels(image, pixelRatio);
    app = isAppOnly(data);
    subject = app ? "app" : "runner";
    passes = app ? !hasPixels : hasPixels;
    debug("pixelConditionFn %o", {
      pixelRatio: pixelRatio,
      subject: subject,
      hasPixels: hasPixels,
      expectedPixels: !app
    });
    return passes;
  };

  multipartImages = [];

  clearMultipartState = function() {
    debug("clearing %d cached multipart images", multipartImages.length);
    return multipartImages = [];
  };

  imagesMatch = function(img1, img2) {
    return img1.bitmap.data.equals(img2.bitmap.data);
  };

  lastImagesAreDifferent = function(data, image) {
    var matches, previous;
    previous = _.last(multipartImages);
    if (!previous) {
      debug("no previous image to compare");
      return true;
    }
    matches = imagesMatch(previous.image, image);
    debug("comparing previous and current image pixels %o", {
      previous: previous.__ID__,
      matches: matches
    });
    return !matches;
  };

  multipartConditionFn = function(data, image) {
    if (data.current === 1) {
      return pixelConditionFn(data, image) && lastImagesAreDifferent(data, image);
    } else {
      return lastImagesAreDifferent(data, image);
    }
  };

  stitchScreenshots = function(pixelRatio) {
    var fullHeight, fullImage, fullWidth, heightMarker, takenAts;
    fullWidth = _.chain(multipartImages).map("data.clip.width").min().multiply(pixelRatio).value();
    fullHeight = _.chain(multipartImages).sumBy("data.clip.height").multiply(pixelRatio).value();
    debug("stitch " + multipartImages.length + " images together");
    takenAts = [];
    heightMarker = 0;
    fullImage = new Jimp(fullWidth, fullHeight);
    _.each(multipartImages, function(arg) {
      var croppedImage, data, image, takenAt;
      data = arg.data, image = arg.image, takenAt = arg.takenAt;
      croppedImage = crop(image, data.clip, pixelRatio);
      debug("stitch: add image at (0, " + heightMarker + ")");
      takenAts.push(takenAt);
      fullImage.composite(croppedImage, 0, heightMarker);
      return heightMarker += croppedImage.bitmap.height;
    });
    return {
      image: fullImage,
      takenAt: takenAts
    };
  };

  getType = function(details) {
    if (details.buffer) {
      return details.buffer.type;
    } else {
      return details.image.getMIME();
    }
  };

  getBuffer = function(details) {
    if (details.buffer) {
      return Promise.resolve(details.buffer);
    } else {
      return Promise.promisify(details.image.getBuffer).call(details.image, Jimp.AUTO);
    }
  };

  getDimensions = function(details) {
    var pick;
    pick = function(obj) {
      return _.pick(obj, "width", "height");
    };
    if (details.buffer) {
      return pick(sizeOf(details.buffer));
    } else {
      return pick(details.image.bitmap);
    }
  };

  ensureUniquePath = function(withoutExt, extension, num) {
    var fullPath;
    if (num == null) {
      num = 0;
    }
    fullPath = num ? withoutExt + " (" + num + ")." + extension : withoutExt + "." + extension;
    return fs.pathExists(fullPath).then(function(found) {
      if (found) {
        return ensureUniquePath(withoutExt, extension, num += 1);
      }
      return fullPath;
    });
  };

  getPath = function(data, ext, screenshotsFolder) {
    var index, maxFileNameLength, names, specNames, withoutExt;
    specNames = (data.specName || "").split(pathSeparatorRe);
    if (data.name) {
      names = data.name.split(pathSeparatorRe).map(replaceInvalidChars);
    } else {
      names = [data.titles.map(replaceInvalidChars).join(RUNNABLE_SEPARATOR)];
    }
    maxFileNameLength = 220;
    index = names.length - 1;
    if (names[index].length > maxFileNameLength) {
      names[index] = _.truncate(names[index], {
        length: maxFileNameLength,
        omission: ''
      });
    }
    if (data.testFailure) {
      names[index] = names[index] + " (failed)";
    }
    withoutExt = path.join.apply(path, [screenshotsFolder].concat(slice.call(specNames), slice.call(names)));
    return ensureUniquePath(withoutExt, ext);
  };

  getPathToScreenshot = function(data, details, screenshotsFolder) {
    var ext;
    ext = mime.extension(getType(details));
    return getPath(data, ext, screenshotsFolder);
  };

  module.exports = {
    crop: crop,
    getPath: getPath,
    clearMultipartState: clearMultipartState,
    imagesMatch: imagesMatch,
    copy: function(src, dest) {
      return fs.copyAsync(src, dest, {
        overwrite: true
      })["catch"]({
        code: "ENOENT"
      }, function() {});
    },
    get: function(screenshotsFolder) {
      screenshotsFolder = path.join(screenshotsFolder, "**", "*");
      return glob(screenshotsFolder, {
        nodir: true
      });
    },
    capture: function(data, automate) {
      var conditionFn, multipart, takenAt;
      __ID__ = _.uniqueId("s");
      debug("capturing screenshot %o", data);
      if (data.simple) {
        takenAt = new Date().toJSON();
        return automate(data).then(function(dataUrl) {
          return {
            takenAt: takenAt,
            multipart: false,
            buffer: dataUriToBuffer(dataUrl)
          };
        });
      }
      multipart = isMultipart(data);
      conditionFn = multipart ? multipartConditionFn : pixelConditionFn;
      return captureAndCheck(data, automate, conditionFn).then(function(arg) {
        var image, pixelRatio, takenAt;
        image = arg.image, takenAt = arg.takenAt;
        pixelRatio = image.bitmap.width / data.viewport.width;
        debug("pixel ratio is", pixelRatio);
        if (multipart) {
          debug("multi-part " + data.current + "/" + data.total);
        }
        if (multipart && data.total > 1) {
          if (data.current === 1) {
            clearMultipartState();
          }
          debug("storing image for future comparison", __ID__);
          multipartImages.push({
            data: data,
            image: image,
            takenAt: takenAt,
            __ID__: __ID__
          });
          if (data.current === data.total) {
            image = stitchScreenshots(pixelRatio).image;
            return {
              image: image,
              pixelRatio: pixelRatio,
              multipart: multipart,
              takenAt: takenAt
            };
          } else {
            return {};
          }
        }
        if (isAppOnly(data) || isMultipart(data)) {
          image = crop(image, data.clip, pixelRatio);
        }
        return {
          image: image,
          pixelRatio: pixelRatio,
          multipart: multipart,
          takenAt: takenAt
        };
      }).then(function(arg) {
        var image, multipart, pixelRatio, takenAt;
        image = arg.image, pixelRatio = arg.pixelRatio, multipart = arg.multipart, takenAt = arg.takenAt;
        if (!image) {
          return null;
        }
        if (image && data.userClip) {
          image = crop(image, data.userClip, pixelRatio);
        }
        return {
          image: image,
          pixelRatio: pixelRatio,
          multipart: multipart,
          takenAt: takenAt
        };
      });
    },
    save: function(data, details, screenshotsFolder) {
      return getPathToScreenshot(data, details, screenshotsFolder).then(function(pathToScreenshot) {
        debug("save", pathToScreenshot);
        return getBuffer(details).then(function(buffer) {
          return fs.outputFileAsync(pathToScreenshot, buffer);
        }).then(function() {
          return fs.statAsync(pathToScreenshot).get("size");
        }).then(function(size) {
          var dimensions, multipart, pixelRatio, takenAt;
          dimensions = getDimensions(details);
          multipart = details.multipart, pixelRatio = details.pixelRatio, takenAt = details.takenAt;
          return {
            size: size,
            takenAt: takenAt,
            dimensions: dimensions,
            multipart: multipart,
            pixelRatio: pixelRatio,
            name: data.name,
            specName: data.specName,
            testFailure: data.testFailure,
            path: pathToScreenshot
          };
        });
      });
    },
    afterScreenshot: function(data, details) {
      var duration;
      duration = new Date() - new Date(data.startTime);
      details = _.extend({}, data, details, {
        duration: duration
      });
      details = _.pick(details, "size", "takenAt", "dimensions", "multipart", "pixelRatio", "name", "specName", "testFailure", "path", "scaled", "blackout", "duration");
      if (!plugins.has("after:screenshot")) {
        return Promise.resolve(details);
      }
      return plugins.execute("after:screenshot", details).then((function(_this) {
        return function(updates) {
          if (!_.isPlainObject(updates)) {
            return details;
          }
          return _.extend(details, _.pick(updates, "size", "dimensions", "path"));
        };
      })(this));
    }
  };

}).call(this);
