// script.js

// Import necessary elements from the DOM
const fileInput = document.getElementById('file-input');
const addFilesButton = document.getElementById('add-files');
const selectedFilesList = document.getElementById('selected-files-list');
const fileList = document.getElementById('file-list');
const generatePdfButton = document.getElementById('generate-pdf');
const output = document.getElementById('output');
const coverDescriptionInput = document.getElementById('cover-description');
const outputNameInput = document.getElementById('output-name');
const coverTitleInput = document.getElementById('cover-title');

// Preview Elements
const previewTitle = document.getElementById('preview-title');
const previewDescription = document.getElementById('preview-description');
const previewCategories = document.getElementById('preview-categories');

let filesData = []; // Main list of added files
let selectedFiles = []; // Temporary list of selected files before adding

// Function to create a dummy PDF with given text
async function createDummyPdf(text) {
  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const timesRomanFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
  const { width, height } = page.getSize();
  const fontSize = 24;
  page.drawText(text, {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize,
    font: timesRomanFont,
    color: PDFLib.rgb(0, 0, 0),
  });
  const pdfBytes = await pdfDoc.save();
  return new Uint8Array(pdfBytes);
}

// Function to add dummy PDFs to filesData
async function addDummyPdfs() {
  const firstPdfText = "This is the first dummy PDF.";
  const secondPdfText = "This is the second dummy PDF.";

  const firstPdfBytes = await createDummyPdf(firstPdfText);
  const secondPdfBytes = await createDummyPdf(secondPdfText);

  filesData.push({
    name: 'the first pdf',
    fileName: 'the first pdf.pdf',
    data: firstPdfBytes
  });

  filesData.push({
    name: 'the second pdf',
    fileName: 'the second pdf.pdf',
    data: secondPdfBytes
  });

  renderFileList();
  updatePreviewCategories();
}

// Call addDummyPdfs when the script loads
addDummyPdfs();

// Event listener to handle file selection
fileInput.addEventListener('change', () => {
  const files = fileInput.files;
  selectedFiles = []; // Reset selectedFiles
  selectedFilesList.innerHTML = ''; // Clear previous selections

  if (files.length === 0) {
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Prevent adding duplicate files based on file name
    if (filesData.some(f => f.fileName === file.name) || selectedFiles.some(f => f.name === file.name)) {
      alert(`File "${file.name}" is already selected or added.`);
      continue;
    }
    selectedFiles.push(file);

    // The index in selectedFiles is selectedFiles.length -1
    const index = selectedFiles.length -1;

    // Create a div for each selected file with a name input
    const div = document.createElement('div');
    div.classList.add('file-item');
    div.innerHTML = `
      <div style="flex: 3; display: flex; align-items: center;">
        <label>${file.name}</label>
        <input type="text" placeholder="Enter name for this document" data-index="${index}" value="${file.name.replace('.pdf', '')}">
      </div>
      <button class="remove-button" data-index="${index}">Remove</button>
    `;
    selectedFilesList.appendChild(div);
  }

  // Clear the file input after processing
  fileInput.value = '';
});

// Event listener to handle removal of files from the selected list
selectedFilesList.addEventListener('click', (event) => {
  if (event.target.classList.contains('remove-button')) {
    const index = event.target.getAttribute('data-index');
    if (index !== null) {
      removeSelectedFile(parseInt(index));
    }
  }
});

// Function to remove a file from the selectedFiles array
function removeSelectedFile(index) {
  selectedFiles.splice(index, 1);
  renderSelectedFiles();
}

// Function to render the selectedFiles list
function renderSelectedFiles() {
  selectedFilesList.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const div = document.createElement('div');
    div.classList.add('file-item');
    div.innerHTML = `
      <div style="flex: 3; display: flex; align-items: center;">
        <label>${file.name}</label>
        <input type="text" placeholder="Enter name for this document" data-index="${index}" value="${file.name.replace('.pdf', '')}">
      </div>
      <button class="remove-button" data-index="${index}">Remove</button>
    `;
    selectedFilesList.appendChild(div);
  });
}

// Event listener to handle name inputs in selected files
selectedFilesList.addEventListener('input', (event) => {
  const index = event.target.getAttribute('data-index');
  if (index !== null) {
    // Optionally, you can update the selectedFiles array here if needed
    // For now, we'll use the entered name when adding files
  }
});

// Event listener to handle adding files from selectedFiles to filesData
addFilesButton.addEventListener('click', () => {
  if (selectedFiles.length === 0) {
    alert('No files selected to add.');
    return;
  }

  // Iterate through selectedFiles and add them to filesData with entered names
  selectedFiles.forEach((file, index) => {
    const nameInput = selectedFilesList.querySelector(`input[data-index="${index}"]`);
    const enteredName = nameInput.value.trim() !== '' ? nameInput.value.trim() : file.name.replace('.pdf', '');

    // Read the file as ArrayBuffer
    const reader = new FileReader();
    reader.onload = function(event) {
      const arrayBuffer = event.target.result;
      filesData.push({
        name: enteredName,
        fileName: file.name,
        data: new Uint8Array(arrayBuffer)
      });
      renderFileList();
      updatePreviewCategories();
    };
    reader.readAsArrayBuffer(file);
  });

  // Clear the selectedFiles and the Selected Files list
  selectedFiles = [];
  selectedFilesList.innerHTML = '';
});

// Function to render the list of added files with name inputs and remove buttons
function renderFileList() {
  fileList.innerHTML = '<h2>Added Files</h2>'; // Add a header

  filesData.forEach((file, index) => {
    const div = document.createElement('div');
    div.classList.add('file-item');
    div.innerHTML = `
      <div style="flex: 3; display: flex; align-items: center;">
        <label>${file.fileName}</label>
        <input type="text" placeholder="Enter name for this document" data-index="${index}" value="${file.name}">
      </div>
      <button class="remove-button" data-index="${index}">Remove</button>
    `;
    fileList.appendChild(div);
  });
}

// Event listener to capture user input for document names in the added files list
fileList.addEventListener('input', (event) => {
  const index = event.target.getAttribute('data-index');
  if (index !== null) {
    filesData[index].name = event.target.value;
    updatePreviewCategories();
  }
});

// Event listener to handle removal of files from the added files list using event delegation
fileList.addEventListener('click', (event) => {
  if (event.target.classList.contains('remove-button')) {
    const index = event.target.getAttribute('data-index');
    if (index !== null) {
      removeFile(parseInt(index));
    }
  }
});

// Function to remove a file from filesData and update the UI
function removeFile(index) {
  filesData.splice(index, 1);
  renderFileList();
  updatePreviewCategories();
}

// Event listeners for live preview updates
coverTitleInput.addEventListener('input', () => {
  previewTitle.textContent = coverTitleInput.value || 'This is an example title';
});

coverDescriptionInput.addEventListener('input', () => {
  previewDescription.textContent = coverDescriptionInput.value || 'This is an example description. This is the application for PHD position at ... lab .....';
});

// Function to update the categories in the live preview
function updatePreviewCategories() {
  previewCategories.innerHTML = '';
  filesData.forEach(file => {
    const docName = file.name.trim() !== '' ? file.name : file.fileName;
    const li = document.createElement('li');
    li.textContent = docName;
    previewCategories.appendChild(li);
  });
}

// Utility function to wrap text within a specified width
function wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (textWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// Event listener to generate the concatenated PDF with cover page
generatePdfButton.addEventListener('click', async () => {
  if (filesData.length === 0) {
    alert('Please add at least one PDF file.');
    return;
  }

  // Get user inputs for output file name and cover title
  let outputFileName = outputNameInput.value.trim();
  if (outputFileName === '') {
    outputFileName = 'merged.pdf';
  } else if (!outputFileName.toLowerCase().endsWith('.pdf')) {
    outputFileName += '.pdf';
  }

  const coverTitle = coverTitleInput.value.trim();
  const coverDescription = coverDescriptionInput.value.trim();

  try {
    // Create a new PDFDocument
    const mergedPdf = await PDFLib.PDFDocument.create();

    // Embed the Libre Baskerville font for headings and Roboto for body
    const libreBaskervilleFont = await mergedPdf.embedFont(PDFLib.StandardFonts.TimesRomanBold); // Substitute for Libre Baskerville Bold
    const robotoFont = await mergedPdf.embedFont(PDFLib.StandardFonts.TimesRoman); // Substitute for Roboto

    // Create a cover page
    const coverPage = mergedPdf.addPage();
    const { width, height } = coverPage.getSize();

    // Centering calculations
    const centerX = width / 2;
    let currentY = height - 100; // Start 100 units from the top

    // Draw the cover title if provided
    if (coverTitle !== '') {
      // Calculate text width for proper centering
      const titleText = coverTitle;
      const titleWidth = libreBaskervilleFont.widthOfTextAtSize(titleText, 30);
      coverPage.drawText(titleText, {
        x: centerX - titleWidth / 2,
        y: currentY,
        size: 30,
        font: libreBaskervilleFont,
        color: PDFLib.rgb(0, 0, 0),
      });
      currentY -= 50; // Move down after title
    }

    // Draw the cover description if provided
    if (coverDescription !== '') {
      const maxWidth = width - 100;
      const descriptionLines = wrapText(coverDescription, robotoFont, 16, maxWidth);
      descriptionLines.forEach((line) => {
        const lineWidth = robotoFont.widthOfTextAtSize(line, 16);
        coverPage.drawText(line, {
          x: centerX - lineWidth / 2,
          y: currentY,
          size: 16,
          font: robotoFont,
          color: PDFLib.rgb(0, 0, 0),
        });
        currentY -= 20;
      });
      currentY -= 30; // Add space after description
    }

    // Draw 'Category' heading
    const categoryHeading = 'Category';
    const categoryWidth = libreBaskervilleFont.widthOfTextAtSize(categoryHeading, 24);
    coverPage.drawText(categoryHeading, {
      x: centerX - categoryWidth / 2,
      y: currentY,
      size: 24,
      font: libreBaskervilleFont,
      color: PDFLib.rgb(0, 0, 0),
    });

    currentY -= 40; // Adjust y position for the list of links

    let pageIndexOffset = 1; // Since the cover page is page 0

    for (let i = 0; i < filesData.length; i++) {
      const file = filesData[i];
      const pdf = await PDFLib.PDFDocument.load(file.data);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      const startPageIndex = pageIndexOffset;

      // Add pages to the merged PDF and update the pageIndexOffset
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
        pageIndexOffset += 1;
      });

      // Prepare the display name (use entered name)
      const docName = file.name.trim() !== '' ? file.name : file.fileName;

      // Draw the link text on the cover page, centered
      const linkText = docName;
      const linkWidth = robotoFont.widthOfTextAtSize(linkText, 18);
      coverPage.drawText(linkText, {
        x: centerX - linkWidth / 2,
        y: currentY,
        size: 18,
        font: robotoFont,
        color: PDFLib.rgb(0, 0, 1), // Blue color for links
      });

      // Calculate text width to define the clickable area
      const linkHeight = 18; // Font size

      // Create a GoTo action to the target page with 'Fit' view
      const goToAction = mergedPdf.context.obj({
        Type: 'Action',
        S: 'GoTo',
        D: [mergedPdf.getPage(startPageIndex).ref, PDFLib.PDFName.of('Fit')],
      });

      // Define the link annotation dictionary
      const linkAnnotation = mergedPdf.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [centerX - linkWidth / 2, currentY, centerX + linkWidth / 2, currentY + linkHeight],
        Border: [0, 0, 0],
        A: goToAction,
      });

      // Retrieve the existing Annots array or initialize it
      let annots = coverPage.node.Annots();
      if (!annots) {
        annots = mergedPdf.context.obj([]);
        coverPage.node.Annots(annots);
      }

      // Add the annotation to the Annots array
      annots.push(linkAnnotation);

      currentY -= 30; // Move down for the next link
    }

    // Finalize the PDF and convert it to bytes
    const pdfBytes = await mergedPdf.save();

    // Provide the PDF for download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    output.innerHTML = `<a href="${url}" download="${outputFileName}">Download ${outputFileName}</a>`;
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('An error occurred while generating the PDF. Check the console for details.');
  }
});