const fs = require('fs');
const Jimp = require('jimp');
const PDFDocument = require('pdfkit');
const Promise = require('bluebird');
const help = require('./helper');
let documentsDir = __dirname + '/../fixtures/documents/random/';
let assetDocumentsDir = __dirname + '/../fixtures/documents/';
let fontsDir = __dirname + '/../fixtures/fonts/'

/**
 * Generate png, jpeg, bmp
 * @param {String} format 
 * @param {String} text
 * 
 * @returns {String} path/to/generated/image
 */
function generateImage(format, text) {
  let imagePath = documentsDir + help.randomAlphaNumeric(20) + '.' + format;

  let image = new Jimp(300, 400, 'white', (err, image) => {
    if (err) throw err
  });

  return Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
    .then(font => {
      image.print(
        font,
        10,
        10,
        text,
        50,
        (err, image, { x, y }) => {
          for (let i = 0; i < 5; i++) {
            y += 20;
            image.print(font, x, y, help.randomAlphaNumeric(15), 50);
          }
        }
      );
      return image;
    })
    .then(image => {
      return image.writeAsync(imagePath)
    })
    .then(() => {
      return imagePath;
    })
    .catch((err) => {
      console.log(err);
    })
}

/**
 * Generate pdf with custom text
 * @param {String} text
 * 
 * @returns {String} /path/to/generated/pdf
 */
function generatePdf(text) {
  let documentPath = documentsDir + help.randomAlphaNumeric(20) + '.pdf';
  let content = `${text}\n${documentPath}`;

  let pdf = new PDFDocument();

  return new Promise((resolve, reject) => {
    // https://github.com/foliojs/pdfkit/issues/265#issuecomment-246564718
    // To determine when the PDF has finished being written successfully 
    // we need to confirm the following 2 conditions:
    //
    //   1. The write stream has been closed
    //   2. PDFDocument.end() was called syncronously without an error being thrown

    let pendingStepCount = 2;

    const stepFinished = () => {
      if (--pendingStepCount == 0) {
        resolve(documentPath);
      }
    };

    const writeStream = fs.createWriteStream(documentPath);
    writeStream.on('close', stepFinished);
    pdf.pipe(writeStream);

    pdf.font(fontsDir + 'PalatinoBold.ttf')
      .fontSize(25)
      .text(content, 100, 100);

    pdf.image(assetDocumentsDir + 'investree.jpg', {
      fit: [300, 300],
      align: 'center',
      valign: 'center'
    });

    pdf.end();

    stepFinished();
  });
}

module.exports = {
  generateImage: generateImage,
  generatePdf: generatePdf
}