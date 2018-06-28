const config = require('config');
const { Logger } = require('@hmcts/nodejs-logging');

const uploadEvidenceUrl = config.get('api.uploadEvidenceUrl');
const maxFileSize = config.get('features.evidenceUpload.maxFileSize');
const formidable = require('formidable');
const pt = require('path');
const fs = require('fs');
const request = require('request');
const { get } = require('lodash');
const fileTypeWhitelist = require('steps/reasons-for-appealing/evidence-upload/fileTypeWhitelist');

const maxFileSizeExceededError = 'MAX_FILESIZE_EXCEEDED_ERROR';
const wrongFileTypeError = 'WRONG_FILE_TYPE_ERROR';


function makeDir(path, dirCallback) {
  const p = pt.join(__dirname, path);
  fs.stat(p, (fsError, stats) => {
    if (fsError || !stats.isDirectory()) {
      return fs.mkdir(p, dirCallback);
    }
    return dirCallback();
  });
}

function handleUpload(req, res, next) {
  const pathToUploadFolder = './../../../uploads';
  const logger = Logger.getLogger('EvidenceUpload.js');

  if (req.method.toLowerCase() === 'post') {
    return makeDir(pathToUploadFolder, mkdirError => {
      if (mkdirError) {
        return next(mkdirError);
      }
      const multiplier = 1024;
      const incoming = new formidable.IncomingForm({
        uploadDir: pt.resolve(__dirname, pathToUploadFolder),
        keepExtensions: true,
        type: 'multipart',
        maxFileSize: maxFileSize * multiplier * multiplier
      });

      incoming.once('error', er => {
        logger.info('error while receiving the file from the client', er);
      });

      incoming.once('fileBegin', function fileBegin(field, file) {
        if (file && file.name && !fileTypeWhitelist.find(el => el === file.type)) {
          /* eslint-disable no-invalid-this */
          return this.emit('error', wrongFileTypeError);
          /* eslint-enable no-invalid-this */
        }
        return true;
      });

      incoming.once('file', (field, file) => {
        if (file.name && file.size) {
          const pathToFile = `${pt.resolve(__dirname, pathToUploadFolder)}/${file.name}`;
          fs.rename(file.path, pathToFile);
        }
      });


      incoming.once('aborted', () => {
        logger.log('user aborted upload');
        return next(new Error());
      });

      incoming.once('end', () => {
        logger.log('-> upload done');
      });

      return incoming.parse(req, (uploadingError, fields, files) => {
        const unprocessableEntityStatus = 422;

        if (uploadingError || !get(files, 'uploadEv.name')) {
          /* eslint-disable operator-linebreak */
          if (uploadingError &&
            uploadingError.message &&
            uploadingError.message.match(/maxFileSize exceeded/)) {
            /* eslint-enable operator-linebreak */
            // cater for the horrible formidable.js error
            /* eslint-disable no-param-reassign */
            uploadingError = maxFileSizeExceededError;
            /* eslint-enable no-param-reassign */
          }
          // this is an obvious mistake but achieves our goal somehow.
          // I'll have to come back to this.
          res.status = unprocessableEntityStatus;
          req.body = {
            uploadEv: uploadingError
          };
          return next();
        }

        const pathToFile = `${pt
          .resolve(__dirname, pathToUploadFolder)}/${files.uploadEv.name}`;

        return request.post({
          url: uploadEvidenceUrl,
          formData: {
            file: fs.createReadStream(pathToFile)
          }
        }, (forwardingError, resp, body) => {
          if (!forwardingError) {
            logger.info('No forwarding error, about to save data');
            const b = JSON.parse(body);
            req.body = {
              uploadEv: b.documents[0].originalDocumentName,
              link: b.documents[0]._links.self.href
            };

            return fs.unlink(pathToFile, next);
          }
          return next(forwardingError);
        });
      });
    });
  }
  return next();
}

module.exports = { makeDir, handleUpload, maxFileSizeExceededError, wrongFileTypeError };