const { Question, goTo } = require('@hmcts/one-per-page');
const { form, text } = require('@hmcts/one-per-page/forms');
const { Logger } = require('@hmcts/nodejs-logging');
const config = require('config');

const uploadEvidenceUrl = config.get('api.uploadEvidenceUrl');
const Joi = require('joi');
const paths = require('paths');
const formidable = require('formidable');
const pt = require('path');
const fs = require('fs');
const request = require('request');

class EvidenceUpload extends Question {
  static get path() {
    return paths.reasonsForAppealing.evidenceUpload;
  }

  static makeDir(path, dirCallback) {
    const p = pt.join(__dirname, path);
    fs.stat(p, (fsError, stats) => {
      if (fsError || !stats.isDirectory()) {
        return fs.mkdir(p, dirCallback);
      }
      return dirCallback();
    });
  }

  static handleUpload(req, res, next) {
    const pathToUploadFolder = './../../../uploads';
    const logger = Logger.getLogger('EvidenceUpload.js');
    if (req.method.toLowerCase() === 'post') {

      //res.status(413);
      //return res.render('evidence', { uploadEv: req.params.uploadEv, field });

      return EvidenceUpload.makeDir(pathToUploadFolder, mkdirError => {
        if (mkdirError) {
          console.info('next mkdir')

          return next(mkdirError);
        }

        const incoming = new formidable.IncomingForm({
          uploadDir: pt.resolve(__dirname, pathToUploadFolder),
          keepExtensions: true,
          type: 'multipart'
        });

        incoming.once('error', er => {
          console.info('error')

          logger.info('error while receiving the file from the client', er);
        });

        incoming.on('fileBegin', function(field, file) {
          console.info('fileBegin')

          console.info('file begin ', arguments)
          console.log(file.type) // => mime type
          if (file.type !== 'image/jpeg') {
            return this.emit('error', 'Size must not be over 3MB');
             // req.pause();
            //return next(new Error('not the right file'));
            //req.connection.destroy();
/*            try { throw new Error("Stopping file upload..."); }
            catch (e) {*/
             // res.status(413);
             // return res.send('oh my')
            /*}*/
          }
        });

        incoming.once('file', (field, file) => {
          console.info('file')

          const pathToFile = `${pt.resolve(__dirname, pathToUploadFolder)}/${file.name}`;
          fs.rename(file.path, pathToFile);
        });

        incoming.on('progress', () => {
          console.info('that is progress')
        })

        incoming.once('error', error => {
          console.info('error')


          console.info('next error')
          //return next(error);
        });

        incoming.once('aborted', () => {
          console.info('aborted')

          logger.log('user aborted upload');
          /*res.writeHead (413, {"connection": 'close', "content-type": 'text/plain'});
          return res.end ('something wrong')*/
          console.info('next aborted')

          return next(new Error())
        });

        incoming.once('end', () => {
          console.info('end')

          logger.log('-> upload done');
        });

        return incoming.parse(req, (uploadingError, fields, files) => {
          console.info('parse')

          if (uploadingError) {
            logger.warn('an error has occured with form upload', uploadingError);
           // console.log('ERROR uploading the file:',error.message);
            res.header('Connection', 'close');
            res.status(400).send({ status:'error' });
            setTimeout(function() { res.end(); }, 500);
            console.info('is this no ', uploadingError)
            return;
            //req.client.destroy();
            //return res.send('oh my')

            //return next(uploadingError);
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
              console.info('next unlink')

              return fs.unlink(pathToFile, next);
            }
            console.info('next forwarding')

            return next(forwardingError);
          });
        });
      });
    }
    console.info('next last')
    return next();
  }

  get middleware() {
    return [EvidenceUpload.handleUpload, ...super.middleware];
  }

  get form() {
    return form({
      uploadEv: text.joi(
        'Please choose a file',
        Joi.string().required()
      ),
      link: text.joi('Unexpected error', Joi.string().required())
    });
  }

  values() {
    return {
      reasonsForAppealing: {
        evidence: [
          {
            url: this.fields.link.value,
            fileName: this.fields.uploadEv.value
          }
        ]
      }
    };
  }

  next() {
    return goTo(this.journey.steps.TheHearing);
  }
}

module.exports = EvidenceUpload;
