function updateIcon(hasFile, uploadText, uploadPaths, checkPath, xPath) {
  uploadPaths.forEach(path => path.style.display = hasFile ? 'none' : '');
  checkPath.style.display = hasFile ? '' : 'none';
  xPath.style.display = 'none';
}

function handleFileSelect(e, uploadText, uploadPaths, checkPath, xPath) {
  const input = e.target;
  const hasFile = input.files.length > 0;
  uploadText.textContent = hasFile ? input.files[0].name : 'Click or drag file';
  updateIcon(hasFile, uploadText, uploadPaths, checkPath, xPath);
}

function handleDrop(e, input, uploadText, uploadPaths, checkPath, xPath) {
  e.preventDefault();
  e.stopPropagation();
  const file = e.dataTransfer.files[0];
  if (file) {
    input.files = e.dataTransfer.files;
    uploadText.textContent = file.name;
    updateIcon(true, uploadText, uploadPaths, checkPath, xPath);
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Add event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Setup firmware upload
  const firmwareUpload = document.querySelector('.file-upload');
  const firmwareInput = document.getElementById('firmwareInput');
  const firmwareUploadText = firmwareUpload.querySelector('.upload-text');
  const firmwareUploadPaths = firmwareUpload.querySelectorAll('.upload-path');
  const firmwareCheckPath = firmwareUpload.querySelector('.check-path');
  const firmwareXPath = firmwareUpload.querySelector('.x-path');
  const firmwareUploadIcon = firmwareUpload.querySelector('.upload-icon');

  // Setup zip upload
  const zipUpload = document.querySelectorAll('.file-upload')[1];
  const zipInput = document.getElementById('zipInput');
  const zipUploadText = zipUpload.querySelector('.upload-text');
  const zipUploadPaths = zipUpload.querySelectorAll('.upload-path');
  const zipCheckPath = zipUpload.querySelector('.check-path');
  const zipXPath = zipUpload.querySelector('.x-path');
  const zipUploadIcon = zipUpload.querySelector('.upload-icon');

  // Firmware upload event listeners
  firmwareUpload.addEventListener('drop', (e) => handleDrop(e, firmwareInput, firmwareUploadText, firmwareUploadPaths, firmwareCheckPath, firmwareXPath));
  firmwareUpload.addEventListener('dragover', handleDragOver);
  firmwareInput.addEventListener('change', (e) => handleFileSelect(e, firmwareUploadText, firmwareUploadPaths, firmwareCheckPath, firmwareXPath));
  
  // Zip upload event listeners
  zipUpload.addEventListener('drop', (e) => handleDrop(e, zipInput, zipUploadText, zipUploadPaths, zipCheckPath, zipXPath));
  zipUpload.addEventListener('dragover', handleDragOver);
  zipInput.addEventListener('change', (e) => handleFileSelect(e, zipUploadText, zipUploadPaths, zipCheckPath, zipXPath));

  // Firmware icon interaction
  firmwareUploadIcon.addEventListener('mouseover', () => {
    if (firmwareInput.files.length > 0) {
      firmwareCheckPath.style.display = 'none';
      firmwareXPath.style.display = '';
    }
  });

  firmwareUploadIcon.addEventListener('mouseout', () => {
    if (firmwareInput.files.length > 0) {
      firmwareCheckPath.style.display = '';
      firmwareXPath.style.display = 'none';
    }
  });

  firmwareUploadIcon.addEventListener('click', (e) => {
    if (firmwareInput.files.length > 0) {
      e.preventDefault();
      firmwareInput.value = '';
      firmwareUploadText.textContent = 'Click or drag firmware file (.bin)';
      updateIcon(false, firmwareUploadText, firmwareUploadPaths, firmwareCheckPath, firmwareXPath);
    }
  });

  // Zip icon interaction
  zipUploadIcon.addEventListener('mouseover', () => {
    if (zipInput.files.length > 0) {
      zipCheckPath.style.display = 'none';
      zipXPath.style.display = '';
    }
  });

  zipUploadIcon.addEventListener('mouseout', () => {
    if (zipInput.files.length > 0) {
      zipCheckPath.style.display = '';
      zipXPath.style.display = 'none';
    }
  });

  zipUploadIcon.addEventListener('click', (e) => {
    if (zipInput.files.length > 0) {
      e.preventDefault();
      zipInput.value = '';
      zipUploadText.textContent = 'Click or drag zip file (.zip)';
      updateIcon(false, zipUploadText, zipUploadPaths, zipCheckPath, zipXPath);
    }
  });
});

document.getElementById('submitBtn').addEventListener('click', async () => {
  const version = document.getElementById('versionInput').value.trim();
  if (!version) return alert("Please enter a version.");

  const firmwareFile = document.getElementById('firmwareInput').files[0];
  const zipFile = document.getElementById('zipInput').files[0];

  if (!firmwareFile && !zipFile) return alert("Please select a firmware file or a zip file.");

  // Create a new zip file for the tar
  const tarZip = new JSZip();

  // Conditionally add update.bin
  if (firmwareFile) {
    // Rename .bin to update.bin
    const updateBin = new File([await firmwareFile.arrayBuffer()], "update.bin");
    tarZip.file("update.bin", await updateBin.arrayBuffer());
  }

  // Conditionally extract and add zip contents
  if (zipFile) {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipFile);
    const files = [];

    for (const filename in zipContent.files) {
      const file = zipContent.files[filename];
      if (!file.dir) {
        const content = await file.async("uint8array");
        files.push({ name: filename, content });
      }
    }
    for (const f of files) {
      tarZip.file(f.name, f.content);
    }
  }

  // Create info.json
  const info = {
    update: document.getElementById('updateChk').checked,
    gauge: document.getElementById('gaugeChk').checked,
    server: document.getElementById('serverChk').checked
  };
  const infoBlob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
  const infoFile = new File([infoBlob], "info.json");

  // Add files to the zip
  tarZip.file("info.json", await infoFile.arrayBuffer());

  // Generate the tar file
  const tarContent = await tarZip.generateAsync({
    type: "uint8array",
    compression: "STORE",
    mimeType: "application/x-tar"
  });

  // Download tar file
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([tarContent], { type: "application/x-tar" }));
  a.download = `${version}.tar`;
  a.click();
});
