const fileInput = document.getElementById('file-input');
const addFilesButton = document.getElementById('add-files');
const fileList = document.getElementById('file-list');
const generatePdfButton = document.getElementById('generate-pdf');
const output = document.getElementById('output');

let filesData = [];

addFilesButton.addEventListener('click', () => {
  const files = fileInput.files;
  if (files.length === 0) {
    alert('Please select at least one PDF file.');
    return;
  }
  for (let file of files) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
      filesData.push({
        name: '',
        fileName: file.name,
        data: new Uint8Array(event.target.result)
      });
      renderFileList();
    };
    fileReader.readAsArrayBuffer(file);
  }
  // Clear the file input
  fileInput.value = '';
});

function renderFileList() {
  fileList.innerHTML = '';
  filesData.forEach((file, index) => {
    const div = document.createElement('div');
    div.classList.add('file-item');
    div.innerHTML = `
      <label>${file.fileName}</label>
      <input type="text" placeholder="Enter name for this document" data-index="${index}" value="${file.name}">
    `;
    fileList.appendChild(div);
  });
}

fileList.addEventListener('input', (event) => {
  const index = event.target.getAttribute('data-index');
  filesData[index].name = event.target.value;
});

generatePdfButton.addEventListener('click', async () => {
  if (filesData.length === 0) {
    alert('Please add some PDF files first.');
    return;
  }

  const mergedPdf = await PDFLib.PDFDocument.create();
  const font = await mergedPdf.embedFont(PDFLib.StandardFonts.Helvetica);

  // Create a cover page
  const coverPage = mergedPdf.addPage();
  const { width, height } = coverPage.getSize();

  coverPage.drawText('Category', {
    x: 50,
    y: height - 50,
    size: 24,
    font,
  });

  let linkYPosition = height - 100;

  let pageIndexOffset = 1; // Since the cover page is page 0

  for (let i = 0; i < filesData.length; i++) {
    const file = filesData[i];
    const pdf = await PDFLib.PDFDocument.load(file.data);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    const startPageIndex = pageIndexOffset;

    // Add pages to the merged PDF
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
      pageIndexOffset += 1;
    });

    // Add link to the cover page
    coverPage.drawText(file.name || file.fileName, {
      x: 50,
      y: linkYPosition + 5,
      size: 16,
      font,
      color: PDFLib.rgb(0, 0, 1),
    });

    coverPage.annotate({
      type: 'link',
      x: 50,
      y: linkYPosition,
      width: 400,
      height: 20,
      borderColor: PDFLib.rgb(0, 0, 0),
      borderWidth: 0,
      action: {
        type: 'GoTo',
        pageIndex: startPageIndex,
      },
    });

    linkYPosition -= 30;
  }

  const pdfBytes = await mergedPdf.save();

  // Provide the PDF for download
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  output.innerHTML = `<a href="${url}" download="merged.pdf">Download Merged PDF</a>`;
});