// File: js/pdf-handler.js

/*
  ==============================================
  PDF Cat - PDF Handler JavaScript File
  ==============================================
  
  Purpose:
    - Contains functions related to PDF processing, such as concatenation and cover page generation.
  
  Description:
    - Utilizes the pdf-lib library to create, merge, and manipulate PDF documents based on user inputs.
  
  Interactions:
    - Imported and used by main.js to perform PDF-related tasks.
    - Relies on the pdf-lib library loaded from libs/pdf-lib.min.js.
  
  Customization:
    - Modify the PDF generation logic to change the layout or style of the cover page.
    - Add new functionalities like adding images, different fonts, or additional metadata.
    - Adjust the handling of PDF pages (e.g., adding bookmarks, annotations).
*/

// Access pdf-lib's PDFDocument, rgb, and StandardFonts from the global PDFLib object
const { PDFDocument, rgb, StandardFonts } = PDFLib;

/**
 * Function: createDummyPdf
 * Description: Creates a dummy PDF with the provided text. Useful for demonstration or testing purposes.
 * @param {string} text - The text to include in the dummy PDF.
 * @returns {Promise<Uint8Array>} - A promise that resolves to the generated PDF as a Uint8Array.
 */
export async function createDummyPdf(text) {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a blank page with specified dimensions
  const page = pdfDoc.addPage([600, 400]); // Width: 600, Height: 400
  
  // Embed the Times Roman font for text rendering
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  
  // Get the size of the page to position the text appropriately
  const { width, height } = page.getSize();
  const fontSize = 24; // Define font size
  
  // Draw the provided text onto the page
  page.drawText(text, {
    x: 50, // X-coordinate from the left
    y: height - 4 * fontSize, // Y-coordinate from the bottom
    size: fontSize, // Font size
    font: timesRomanFont, // Embedded font
    color: rgb(0, 0, 0), // Black color
  });
  
  // Save the PDF document and return it as a Uint8Array
  const pdfBytes = await pdfDoc.save();
  return new Uint8Array(pdfBytes);
}

/**
 * Function: addDummyPdfs
 * Description: Adds predefined dummy PDFs to the provided filesData array.
 * This is useful for initializing the application with sample data.
 * @param {Array} filesData - The main array holding added files.
 */
export async function addDummyPdfs(filesData) {
  const firstPdfText = "This is the first dummy PDF.";
  const secondPdfText = "This is the second dummy PDF.";

  // Create two dummy PDFs using the createDummyPdf function
  const firstPdfBytes = await createDummyPdf(firstPdfText);
  const secondPdfBytes = await createDummyPdf(secondPdfText);

  // Push the dummy PDFs into the filesData array with relevant metadata
  filesData.push({
    name: 'the first pdf', // Display name for the PDF
    fileName: 'the first pdf.pdf', // Original file name
    data: firstPdfBytes // PDF data as Uint8Array
  });

  filesData.push({
    name: 'the second pdf', // Display name for the PDF
    fileName: 'the second pdf.pdf', // Original file name
    data: secondPdfBytes // PDF data as Uint8Array
  });
}

/**
 * Function: generateMergedPDF
 * Description: Generates a merged PDF document with a custom cover page containing links to each individual PDF.
 * @param {Array} filesData - The array containing all added PDF files with their metadata and data.
 * @param {string} coverTitle - The title to display on the cover page.
 * @param {string} coverDescription - The description to display on the cover page.
 * @param {string} outputFileName - The desired name for the output merged PDF file.
 * @returns {Promise<Uint8Array>} - A promise that resolves to the generated merged PDF as a Uint8Array.
 */
export async function generateMergedPDF(filesData, coverTitle, coverDescription, outputFileName) {
  // Create a new PDFDocument for the merged PDF
  const mergedPdf = await PDFDocument.create();

  // Embed standard fonts for styling (substitutes for custom fonts)
  const libreBaskervilleFont = await mergedPdf.embedFont(StandardFonts.TimesRomanBold); // Substitute for Libre Baskerville Bold
  const robotoFont = await mergedPdf.embedFont(StandardFonts.TimesRoman); // Substitute for Roboto

  // Add a new page for the cover page
  const coverPage = mergedPdf.addPage();
  const { width, height } = coverPage.getSize();

  // Calculate the center of the page for centering text
  const centerX = width / 2;
  let currentY = height - 100; // Start 100 units from the top of the page

  // =========================
  // 1. Add Cover Title
  // =========================

  if (coverTitle !== '') { // Check if a cover title is provided
    const titleText = coverTitle;
    const titleWidth = libreBaskervilleFont.widthOfTextAtSize(titleText, 30); // Calculate the width of the title text for centering
    coverPage.drawText(titleText, {
      x: centerX - titleWidth / 2, // Center the title horizontally
      y: currentY, // Y-coordinate position
      size: 30, // Font size
      font: libreBaskervilleFont, // Embedded font
      color: rgb(0, 0, 0), // Black color
    });
    currentY -= 50; // Move down 50 units for the next element
  }

  // =========================
  // 2. Add Cover Description
  // =========================

  if (coverDescription !== '') { // Check if a cover description is provided
    const maxWidth = width - 100; // Define the maximum width for the description text
    const descriptionLines = wrapText(coverDescription, robotoFont, 16, maxWidth); // Wrap the description text to fit within maxWidth

    descriptionLines.forEach((line) => { // Iterate through each line of wrapped text
      const lineWidth = robotoFont.widthOfTextAtSize(line, 16); // Calculate the width of the line for centering
      coverPage.drawText(line, {
        x: centerX - lineWidth / 2, // Center the text horizontally
        y: currentY, // Y-coordinate position
        size: 16, // Font size
        font: robotoFont, // Embedded font
        color: rgb(0, 0, 0), // Black color
      });
      currentY -= 20; // Move down 20 units for the next line
    });
    currentY -= 30; // Add additional space after the description
  }

  // =========================
  // 3. Add Category Heading
  // =========================

  const categoryHeading = 'Category'; // Define the heading for the categories list
  const categoryWidth = libreBaskervilleFont.widthOfTextAtSize(categoryHeading, 24); // Calculate the width for centering
  coverPage.drawText(categoryHeading, {
    x: centerX - categoryWidth / 2, // Center the heading horizontally
    y: currentY, // Y-coordinate position
    size: 24, // Font size
    font: libreBaskervilleFont, // Embedded font
    color: rgb(0, 0, 0), // Black color
  });

  currentY -= 40; // Move down 40 units for the categories list

  let pageIndexOffset = 1; // Initialize page index offset (cover page is page 0)

  // =========================
  // 4. Add PDFs and Links
  // =========================

  for (let i = 0; i < filesData.length; i++) { // Iterate through each added PDF file
    const file = filesData[i];
    const pdf = await PDFDocument.load(file.data); // Load the individual PDF document
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices()); // Copy all pages from the individual PDF
    const startPageIndex = pageIndexOffset; // Record the starting page index for the individual PDF

    // Add each copied page to the merged PDF and update the pageIndexOffset
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
      pageIndexOffset += 1;
    });

    // Prepare the display name for the PDF (use entered name or original file name)
    const docName = file.name.trim() !== '' ? file.name : file.fileName;

    // Draw the link text on the cover page, centered horizontally
    const linkText = docName;
    const linkWidth = robotoFont.widthOfTextAtSize(linkText, 18); // Calculate the width for centering
    coverPage.drawText(linkText, {
      x: centerX - linkWidth / 2, // Center the text horizontally
      y: currentY, // Y-coordinate position
      size: 18, // Font size
      font: robotoFont, // Embedded font
      color: rgb(0, 0, 1), // Blue color to indicate a link
    });

    const linkHeight = 18; // Define the height of the clickable area (same as font size)

    // Create a GoTo action that navigates to the start page of the individual PDF
    const goToAction = mergedPdf.context.obj({
      Type: 'Action',
      S: 'GoTo',
      D: [mergedPdf.getPage(startPageIndex).ref, PDFLib.PDFName.of('Fit')],
    });

    // Define the link annotation dictionary with the clickable area and action
    const linkAnnotation = mergedPdf.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [centerX - linkWidth / 2, currentY, centerX + linkWidth / 2, currentY + linkHeight], // Defines the clickable rectangle
      Border: [0, 0, 0], // No border for the link
      A: goToAction, // The action to perform on click
    });

    // Retrieve the existing Annots array or initialize it if it doesn't exist
    let annots = coverPage.node.Annots();
    if (!annots) {
      annots = mergedPdf.context.obj([]);
      coverPage.node.Annots(annots);
    }

    // Add the link annotation to the Annots array
    annots.push(linkAnnotation);

    currentY -= 30; // Move down 30 units for the next link
  }

  // =========================
  // 5. Finalize PDF
  // =========================

  const pdfBytes = await mergedPdf.save(); // Save the merged PDF and get the bytes

  return pdfBytes; // Return the merged PDF as a Uint8Array
}

// ==========================
// Utility Functions
// ==========================

/**
 * Function: wrapText
 * Description: Wraps the input text to fit within a specified maximum width.
 * Splits the text into lines that do not exceed the maxWidth.
 * @param {string} text - The text to wrap.
 * @param {Font} font - The embedded font used to measure text width.
 * @param {number} fontSize - The font size used for rendering the text.
 * @param {number} maxWidth - The maximum width allowed for each line.
 * @returns {Array<string>} - An array of wrapped lines.
 */
function wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(' '); // Split the text into individual words
  let lines = []; // Array to hold the wrapped lines
  let currentLine = ''; // Current line being built

  words.forEach((word) => { // Iterate through each word
    const testLine = currentLine + (currentLine ? ' ' : '') + word; // Create a test line with the current word
    const textWidth = font.widthOfTextAtSize(testLine, fontSize); // Calculate the width of the test line

    if (textWidth <= maxWidth) { // If the test line fits within maxWidth
      currentLine = testLine; // Update the current line
    } else { // If the test line exceeds maxWidth
      if (currentLine) lines.push(currentLine); // Push the current line to lines array
      currentLine = word; // Start a new line with the current word
    }
  });

  if (currentLine) {
    lines.push(currentLine); // Push the last line to lines array
  }

  return lines; // Return the array of wrapped lines
}