// File: js/main.js

/*
  ==============================================
  PDF Cat - Main JavaScript File
  ==============================================
  
  Purpose:
    - Handles all DOM interactions, event listeners, and user interactions.
    - Delegates PDF processing tasks to pdf-handler.js.
  
  Description:
    - Manages user inputs such as file selections, cover page customizations, and initiates the PDF generation process.
    - Updates the UI based on user actions, including displaying selected files and showing the download link for the generated PDF.
  
  Interactions:
    - Imports functions from pdf-handler.js for PDF creation and manipulation.
    - Utilizes the pdf-lib library loaded from libs/pdf-lib.min.js.
  
  Customization:
    - Modify event listeners to add new functionalities or handle additional user inputs.
    - Update DOM selectors if the HTML structure changes.
    - Extend or modify functions to enhance user experience or add new features.
*/

// Import necessary functions from pdf-handler.js
import { generateMergedPDF, createDummyPdf, addDummyPdfs } from './pdf-handler.js';

// ==========================
// DOM Element References
// ==========================

// File input element for selecting PDF files
const fileInput = document.getElementById('file-input');

// Button to add selected files to the main list
const addFilesButton = document.getElementById('add-files');

// Container to display selected files before adding them to the main list
const selectedFilesList = document.getElementById('selected-files-list');

// Container to display the list of added files with rename and remove options
const fileList = document.getElementById('file-list');

// Button to initiate PDF generation
const generatePdfButton = document.getElementById('generate-pdf');

// Container to display the download link for the generated PDF
const output = document.getElementById('output');

// Input field for specifying the output PDF file name
const outputNameInput = document.getElementById('output-name');

// Input field for specifying the cover page title
const coverTitleInput = document.getElementById('cover-title');

// Textarea for specifying the cover page description
const coverDescriptionInput = document.getElementById('cover-description');

// ==========================
// Preview Elements
// ==========================

// Element to display the live preview of the cover page title
const previewTitle = document.getElementById('preview-title');

// Element to display the live preview of the cover page description
const previewDescription = document.getElementById('preview-description');

// List to display the categories (links to individual PDFs) in the cover page preview
const previewCategories = document.getElementById('preview-categories');

// ==========================
// Data Structures
// ==========================

// Array to hold the main list of added files
let filesData = [];

// Array to hold the list of files selected by the user before adding them to filesData
let selectedFiles = [];

// ==========================
// Initial Setup
// ==========================

/**
 * Initializes the application by adding dummy PDFs to filesData.
 * This is useful for demonstration purposes and ensures the app has initial data.
 */
addDummyPdfs(filesData);

/**
 * Function: addDummyPdfs
 * Description: Adds example dummy PDF files to the main filesData array.
 * Usage: Called during the initial setup to populate the app with sample data.
 */
 
// ==========================
// Event Listeners
// ==========================

/**
 * Event Listener: File Selection
 * Description: Handles the event when a user selects PDF files using the file input.
 */
fileInput.addEventListener('change', handleFileSelection);

/**
 * Event Listener: Remove Selected File
 * Description: Handles the event when a user clicks the "Remove" button on a selected file.
 */
selectedFilesList.addEventListener('click', handleRemoveSelectedFile);

/**
 * Event Listener: Input Change in Selected Files
 * Description: Handles real-time updates when a user changes the name of a selected file.
 */
selectedFilesList.addEventListener('input', handleSelectedFileNameChange);

/**
 * Event Listener: Add Files to Main List
 * Description: Handles the event when a user clicks the "Add Files" button to move selected files to the main list.
 */
addFilesButton.addEventListener('click', handleAddFiles);

/**
 * Event Listener: Input Change in Added Files
 * Description: Handles real-time updates when a user changes the name of an added file.
 */
fileList.addEventListener('input', handleAddedFileNameChange);

/**
 * Event Listener: Remove Added File
 * Description: Handles the event when a user clicks the "Remove" button on an added file.
 */
fileList.addEventListener('click', handleRemoveFile);

/**
 * Event Listener: Cover Title Change
 * Description: Updates the cover page preview in real-time as the user types the cover title.
 */
coverTitleInput.addEventListener('input', handleCoverTitleChange);

/**
 * Event Listener: Cover Description Change
 * Description: Updates the cover page preview in real-time as the user types the cover description.
 */
coverDescriptionInput.addEventListener('input', handleCoverDescriptionChange);

/**
 * Event Listener: Generate PDF
 * Description: Handles the event when a user clicks the "Generate PDF" button to create the merged PDF.
 */
generatePdfButton.addEventListener('click', handleGeneratePdf);

// ==========================
// Event Handler Functions
// ==========================

/**
 * Function: handleFileSelection
 * Description: Processes the files selected by the user, prevents duplicates, and displays them with name inputs.
 */
function handleFileSelection() {
  const files = fileInput.files; // Get the selected files
  selectedFiles = []; // Reset the selectedFiles array
  selectedFilesList.innerHTML = ''; // Clear any existing selected files in the UI

  if (files.length === 0) {
    return; // Exit if no files are selected
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Check for duplicate files based on file name
    if (
      filesData.some(f => f.fileName === file.name) || 
      selectedFiles.some(f => f.name === file.name)
    ) {
      alert(`File "${file.name}" is already selected or added.`);
      continue; // Skip adding duplicate files
    }
    
    selectedFiles.push(file); // Add the file to the selectedFiles array

    const index = selectedFiles.length - 1; // Calculate the index for data attributes

    // Create a div element for each selected file with a name input and remove button
    const div = document.createElement('div');
    div.classList.add('file-item'); // Add CSS class for styling
    div.innerHTML = `
      <div style="flex: 3; display: flex; align-items: center;">
        <label>${file.name}</label>
        <input type="text" placeholder="Enter name for this document" data-index="${index}" value="${file.name.replace('.pdf', '')}">
      </div>
      <button class="remove-button" data-index="${index}">Remove</button>
    `;
    
    selectedFilesList.appendChild(div); // Append the div to the selected files list in the UI
  }

  fileInput.value = ''; // Reset the file input to allow re-selection of the same files if needed
}

/**
 * Function: handleRemoveSelectedFile
 * Description: Removes a file from the selectedFiles array and updates the UI accordingly.
 * @param {Event} event - The click event triggered by the "Remove" button.
 */
function handleRemoveSelectedFile(event) {
  if (event.target.classList.contains('remove-button')) { // Check if the clicked element is a remove button
    const index = event.target.getAttribute('data-index'); // Get the index of the file to remove
    if (index !== null) {
      removeSelectedFile(parseInt(index)); // Remove the selected file from the array
    }
  }
}

/**
 * Function: removeSelectedFile
 * Description: Removes a file from the selectedFiles array based on the provided index.
 * @param {number} index - The index of the file to remove.
 */
function removeSelectedFile(index) {
  selectedFiles.splice(index, 1); // Remove the file from the selectedFiles array
  renderSelectedFiles(); // Re-render the selected files list in the UI
}

/**
 * Function: renderSelectedFiles
 * Description: Renders the list of selected files in the UI with name inputs and remove buttons.
 */
function renderSelectedFiles() {
  selectedFilesList.innerHTML = ''; // Clear the current list

  selectedFiles.forEach((file, index) => { // Iterate through the selectedFiles array
    const div = document.createElement('div');
    div.classList.add('file-item'); // Add CSS class for styling
    div.innerHTML = `
      <div style="flex: 3; display: flex; align-items: center;">
        <label>${file.name}</label>
        <input type="text" placeholder="Enter name for this document" data-index="${index}" value="${file.name.replace('.pdf', '')}">
      </div>
      <button class="remove-button" data-index="${index}">Remove</button>
    `;
    selectedFilesList.appendChild(div); // Append the div to the selected files list in the UI
  });
}

/**
 * Function: handleSelectedFileNameChange
 * Description: Handles real-time updates when a user changes the name of a selected file.
 * @param {Event} event - The input event triggered by the name input field.
 */
function handleSelectedFileNameChange(event) {
  const index = event.target.getAttribute('data-index'); // Get the index of the file
  if (index !== null) {
    // Currently, no action is taken here.
    // You can implement additional logic if needed when the name changes.
  }
}

/**
 * Function: handleAddFiles
 * Description: Adds the selected files to the main filesData array and updates the UI.
 * - Reads each selected file as an ArrayBuffer.
 * - Pushes the file data into filesData with the entered name.
 * - Renders the added files list and updates the preview categories.
 */
function handleAddFiles() {
  if (selectedFiles.length === 0) { // Check if there are any selected files to add
    alert('No files selected to add.');
    return; // Exit if no files are selected
  }

  // Iterate through each selected file and add it to the main filesData array
  selectedFiles.forEach((file, index) => {
    const nameInput = selectedFilesList.querySelector(`input[data-index="${index}"]`); // Get the corresponding name input
    const enteredName = nameInput.value.trim() !== '' ? nameInput.value.trim() : file.name.replace('.pdf', ''); // Use entered name or default

    // Read the file as an ArrayBuffer using FileReader
    const reader = new FileReader();
    reader.onload = function(event) {
      const arrayBuffer = event.target.result; // Get the result from FileReader
      filesData.push({
        name: enteredName, // Entered or default name
        fileName: file.name, // Original file name
        data: new Uint8Array(arrayBuffer) // File data as Uint8Array
      });
      renderFileList(); // Render the updated list of added files
      updatePreviewCategories(); // Update the preview section to reflect the added files
    };
    reader.readAsArrayBuffer(file); // Initiate reading the file
  });

  // Clear the selectedFiles array and the UI list after adding
  selectedFiles = [];
  selectedFilesList.innerHTML = '';
}

/**
 * Function: renderFileList
 * Description: Renders the main list of added files in the UI with name inputs and remove buttons.
 */
function renderFileList() {
  fileList.innerHTML = '<h2>Added Files</h2>'; // Add a header for the added files section

  filesData.forEach((file, index) => { // Iterate through the filesData array
    const div = document.createElement('div');
    div.classList.add('file-item'); // Add CSS class for styling
    div.innerHTML = `
      <div style="flex: 3; display: flex; align-items: center;">
        <label>${file.fileName}</label>
        <input type="text" placeholder="Enter name for this document" data-index="${index}" value="${file.name}">
      </div>
      <button class="remove-button" data-index="${index}">Remove</button>
    `;
    fileList.appendChild(div); // Append the div to the added files list in the UI
  });
}

/**
 * Function: handleAddedFileNameChange
 * Description: Updates the name of an added file in the filesData array based on user input.
 * @param {Event} event - The input event triggered by the name input field.
 */
function handleAddedFileNameChange(event) {
  const index = event.target.getAttribute('data-index'); // Get the index of the file
  if (index !== null) {
    filesData[index].name = event.target.value; // Update the name in the filesData array
    updatePreviewCategories(); // Update the preview section to reflect the name change
  }
}

/**
 * Function: handleRemoveFile
 * Description: Removes an added file from the filesData array and updates the UI.
 * @param {Event} event - The click event triggered by the "Remove" button.
 */
function handleRemoveFile(event) {
  if (event.target.classList.contains('remove-button')) { // Check if the clicked element is a remove button
    const index = event.target.getAttribute('data-index'); // Get the index of the file to remove
    if (index !== null) {
      removeFile(parseInt(index)); // Remove the file from filesData
    }
  }
}

/**
 * Function: removeFile
 * Description: Removes a file from the filesData array based on the provided index and updates the UI.
 * @param {number} index - The index of the file to remove.
 */
function removeFile(index) {
  filesData.splice(index, 1); // Remove the file from the filesData array
  renderFileList(); // Re-render the added files list in the UI
  updatePreviewCategories(); // Update the preview section to reflect the removal
}

/**
 * Function: handleCoverTitleChange
 * Description: Updates the cover page title in the live preview based on user input.
 */
function handleCoverTitleChange() {
  previewTitle.textContent = coverTitleInput.value || 'This is an example title'; // Update the preview title
}

/**
 * Function: handleCoverDescriptionChange
 * Description: Updates the cover page description in the live preview based on user input.
 */
function handleCoverDescriptionChange() {
  previewDescription.textContent = coverDescriptionInput.value || 'This is an example description. This is the application for PHD position at ... lab .....'; // Update the preview description
}

/**
 * Function: updatePreviewCategories
 * Description: Updates the categories list in the live preview based on the added files.
 */
function updatePreviewCategories() {
  previewCategories.innerHTML = ''; // Clear the current categories list

  filesData.forEach(file => { // Iterate through the filesData array
    const docName = file.name.trim() !== '' ? file.name : file.fileName; // Determine the display name
    const li = document.createElement('li');
    li.textContent = docName; // Set the text content of the list item
    previewCategories.appendChild(li); // Append the list item to the categories list
  });
}

/**
 * Function: handleGeneratePdf
 * Description: Initiates the PDF generation process by collecting user inputs and calling the generateMergedPDF function.
 * - Validates that at least one PDF file has been added.
 * - Retrieves user inputs for output file name, cover title, and cover description.
 * - Calls generateMergedPDF to create the merged PDF with the cover page.
 * - Provides the download link for the generated PDF.
 */
async function handleGeneratePdf() {
  if (filesData.length === 0) { // Ensure there is at least one PDF file to merge
    alert('Please add at least one PDF file.');
    return; // Exit if no files are added
  }

  // Retrieve and sanitize user inputs
  let outputFileName = outputNameInput.value.trim();
  if (outputFileName === '') {
    outputFileName = 'merged.pdf'; // Default file name if none provided
  } else if (!outputFileName.toLowerCase().endsWith('.pdf')) {
    outputFileName += '.pdf'; // Ensure the file name ends with .pdf
  }

  const coverTitle = coverTitleInput.value.trim(); // Get the cover title
  const coverDescription = coverDescriptionInput.value.trim(); // Get the cover description

  try {
    // Call the generateMergedPDF function from pdf-handler.js
    const pdfBytes = await generateMergedPDF(filesData, coverTitle, coverDescription, outputFileName);
    
    // Create a Blob from the PDF bytes
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Generate a URL for the Blob object
    const url = URL.createObjectURL(blob);
    
    // Update the output container with the download link
    output.innerHTML = `<a href="${url}" download="${outputFileName}">Download ${outputFileName}</a>`;
  } catch (error) {
    console.error('Error generating PDF:', error); // Log the error for debugging
    alert('An error occurred while generating the PDF. Check the console for details.'); // Inform the user of the error
  }
}