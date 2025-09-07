// Import the functions you need from the SDKs you need
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
    import { getDatabase, ref as dbRef, push, onValue, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

    // Your web app's Firebase configuration (using config from structure.html)
    const firebaseConfig = {
      apiKey: "AIzaSyCIfleywEbd1rcjymkfEfFYxPpvYdZHGhk",
      authDomain: "cvang-vahan.firebaseapp.com",
      databaseURL: "https://cvang-vahan-default-rtdb.firebaseio.com",
      projectId: "cvang-vahan",
      storageBucket: "cvang-vahan.appspot.com",
      messagingSenderId: "117318825099",
      appId: "1:117318825099:web:afc0e2f863117cb14bfc"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const imagesRef = dbRef(db, 'images');

    // Cloudinary configuration (from structure.html)
    const cloudName = 'dwmrdluul'; // Replace with your Cloudinary cloud name
    const uploadPreset = 'anonymous_upload'; // Replace with your Cloudinary upload preset

    // Global variables
    let selectedFile = null;
    let hasCalculated = false;

    // Expose functions to window object
    window.uploadImage = function() {const uploadBtn = document.querySelector(".colorful-upload-btn");
uploadBtn.style.display = "none";    // Upload button ko hide kar do

      const fileInput = document.getElementById('fileUpload');
      const tagInput = document.getElementById('tagInput');
      const file = fileInput.files[0];
      const tag = tagInput.value.trim();
      const progressBar = document.getElementById('progress');
      const statusText = document.getElementById('status');

      if (!file) {
        showMessage("Please select a file first!", "error");
        return;
      }

      if (!tag) {
        selectedFile = file; // Store file for modal upload
        document.getElementById('tagModal').style.display = 'flex';
        return;
      }

      uploadFile(file, tag, progressBar, statusText);
    };

    window.closeModal = function() {
      document.getElementById('tagModal').style.display = 'none';
      document.getElementById('modalTagInput').value = '';
      document.getElementById('modalProgressContainer').style.display = 'none';
      document.getElementById('modalProgress').style.width = '0%';
      document.getElementById('modalProgress').textContent = '0%';
      document.querySelector('.modal-content .upload-btn').style.display = 'inline-block'; // Show buttons again
      document.querySelector('.modal-content .cancel-btn').style.display = 'inline-block'; // Show buttons again
      selectedFile = null; // Clear selected file
    };

    window.submitTag = function() {
      const modalTagInput = document.getElementById('modalTagInput');
      const tag = modalTagInput.value.trim();
      const progressBar = document.getElementById('progress');
      const statusText = document.getElementById('status');
      const modalProgress = document.getElementById('modalProgress');
      const modalProgressContainer = document.getElementById('modalProgressContainer');

      if (!tag) {
        showMessage("Tag is required!", "error");
        return;
      }

      modalProgressContainer.style.display = 'block';
      document.querySelector('.modal-content .upload-btn').style.display = 'none'; // Hide buttons during upload
      document.querySelector('.modal-content .cancel-btn').style.display = 'none'; // Hide buttons during upload

      uploadFile(selectedFile, tag, progressBar, statusText, modalProgress);
    };

    function uploadFile(file, tag, progressBar, statusText, modalProgress = null) {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('tags', tag);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = function(event) {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          progressBar.style.width = percentComplete + '%';
          progressBar.textContent = percentComplete + '%';
          if (modalProgress) {
            modalProgress.style.width = percentComplete + '%';
            modalProgress.textContent = percentComplete + '%';
          }
          statusText.textContent = 'Uploading...';
        }
      };

      xhr.onload = function() {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          console.log("Cloudinary Response:", data);
          if (!data.secure_url) {
            showMessage('Upload failed: No secure URL received', 'error');
            statusText.textContent = 'Upload failed!';
            closeModal();
            return;
          }
          const imgObj = {
            url: data.secure_url,
            tag: tag,
            name: file.name, // Store original file name for download
            timestamp: Date.now() // Use Date.now() for client-side timestamp
          };
          push(imagesRef, imgObj)
            .then(() => {
              console.log("Firebase Push Successful:", imgObj);
              progressBar.style.width = '100%';
              progressBar.textContent = '100%';
              if (modalProgress) {
                modalProgress.style.width = '100%';
                modalProgress.textContent = '100%';
              }
              statusText.textContent = 'Complete';
              showMessage('Uploaded Successfully!', 'info');
              closeModal();
              document.getElementById('fileUpload').value = ''; // Clear file input
              document.getElementById('tagInput').value = ''; // Clear tag input
              loadImages(); // Reload images to display the new one
            })
            .catch((error) => {
              console.error("Firebase Push Error:", error);
              statusText.textContent = 'Upload failed: Firebase error';
              showMessage('Upload failed: Firebase error', 'error');
              closeModal();
            });
        } else {
          console.error("Cloudinary Upload Failed (HTTP status:", xhr.status, ") Response:", xhr.responseText);
          statusText.textContent = 'Upload failed!';
          showMessage('Upload failed!', 'error');
          closeModal();
        }
      };

      xhr.onerror = function() {
        console.error("Upload error occurred (XHR onerror):", xhr.status);
        statusText.textContent = 'Upload error occurred!';
        showMessage('Upload failed due to a network error!', 'error');
        closeModal();
      };

      xhr.open('POST', url, true);
      xhr.send(formData);
    }

    // Custom message box function (instead of alert)
    function showMessage(message, type = "info") {
      const messageBox = document.createElement("div");
      messageBox.style.position = "fixed";
      messageBox.style.top = "20px";
      messageBox.style.left = "50%";
      messageBox.style.transform = "translateX(-50%)";
      messageBox.style.padding = "15px 25px";
      messageBox.style.borderRadius = "10px";
      messageBox.style.zIndex = "9999";
      messageBox.style.color = "white";
      messageBox.style.fontWeight = "bold";
      messageBox.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
      messageBox.style.transition = "opacity 0.5s ease-in-out";
      messageBox.style.opacity = "1";

      if (type === "error") {
        messageBox.style.backgroundColor = "#f44336"; /* Red */
      } else {
        messageBox.style.backgroundColor = "#4CAF50"; /* Green */
      }

      messageBox.textContent = message;
      document.body.appendChild(messageBox);

      setTimeout(() => {
        messageBox.style.opacity = "0";
        messageBox.addEventListener("transitionend", () => messageBox.remove());
      }, 3000);
    }

    // Function to handle direct image download
    window.downloadImageDirectly = async function(imageUrl, fileName) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        showMessage('Download initiated!', 'info');
      } catch (error) {
        console.error("Error downloading image:", error);
        showMessage('Failed to download image.', 'error');
      }
    };


    function loadImages() {
      const gallery = document.getElementById('gallery');
      gallery.innerHTML = '';

      // Clear the gallery first to avoid duplicates when data updates
      // The onValue listener will handle re-rendering on changes
      onValue(imagesRef, (snapshot) => {
        gallery.innerHTML = ''; // Clear content every time data changes
        const images = snapshot.val();
        const now = Date.now();

        if (images) {
          const sortedImages = Object.entries(images)
            .map(([key, img]) => ({ key, ...img }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Sort by timestamp descending

          sortedImages.forEach(({ key, url, tag, timestamp, name }) => {
            // Check if the image is older than 5 minutes (300,000 milliseconds)
            // If it is, delete it from the database (cleanup logic)
            if (now - (timestamp || 0) > 300000) {
              remove(dbRef(db, `images/${key}`))
                .then(() => console.log(`Image ${key} deleted (older than 5 min)`))
                .catch((error) => console.error("Auto-delete error:", error));
            } else {
              const container = document.createElement('div');
              container.className = 'image-container';

              const imgElement = document.createElement('img');
              imgElement.src = url;
              imgElement.alt = tag || 'Uploaded image';
              imgElement.loading = 'lazy';
              imgElement.onerror = () => { // Fallback for broken images
                imgElement.src = `https://placehold.co/150x150/cccccc/333333?text=Image+Error`;
                console.warn(`Failed to load image: ${url}`);
              };

              const tagElement = document.createElement('p');
              tagElement.className = 'tag';
              tagElement.textContent = `Tag: ${tag || 'No tag'}`;

              // Changed to Download Button with new downloadImageDirectly function
              const downloadBtn = document.createElement('button'); // Changed back to button for click event
              downloadBtn.className = 'download-btn';
              downloadBtn.textContent = 'Download';
              // Call the new download function
              downloadBtn.onclick = () => window.downloadImageDirectly(url, name || `image_${key}.jpg`);

              container.appendChild(imgElement);
              container.appendChild(tagElement);
              container.appendChild(downloadBtn); // Append the download button
              gallery.appendChild(container);
            }
          });
        } else {
          gallery.innerHTML = '<p style="color: #455a64; margin-top: 20px;">No images uploaded yet.</p>';
        }
      });
    }

    // CSAT Calculator Functions
    window.openCSATModal = function() {
      document.getElementById('csatModal').style.display = 'flex';
      hideAllMainContent();
      // Ensure all other full-page views are hidden
      const endorsementPage = document.getElementById('endorsementPage');
      if (endorsementPage) endorsementPage.style.display = 'none';
      const manualVIPage = document.getElementById('manualVIPage');
      if (manualVIPage) manualVIPage.style.display = 'none';
      const claimCountNSTPPage = document.getElementById('claimCountNSTPPage');
      if (claimCountNSTPPage) claimCountNSTPPage.style.display = 'none';
      const inspectionWaiverPage = document.getElementById('inspectionWaiverPage');
      if (inspectionWaiverPage) inspectionWaiverPage.style.display = 'none';
      const rsaContactPage = document.getElementById('rsaContactPage');
      if (rsaContactPage) rsaContactPage.style.display = 'none';
      calculateCSAT();
    };

    window.closeCSATModal = function() {
      document.getElementById('csatModal').style.display = 'none';
      document.getElementById('goodCount').value = '0';
      document.getElementById('badCount').value = '0';
      document.getElementById('requiredCSAT').value = '70';
      document.getElementById('calculateButton').textContent = 'Calculate';
      hasCalculated = false;
      calculateCSAT();
      showAllMainContent();
    };

    window.calculateCSAT = function() {
      const goodCount = parseInt(document.getElementById('goodCount').value) || 0;
      const badCount = parseInt(document.getElementById('badCount').value) || 0;
      const requiredCSAT = parseInt(document.getElementById('requiredCSAT').value);
      const resultSection = document.getElementById('csatResult');
      const status = document.getElementById('csatStatus');
      const calculateButton = document.getElementById('calculateButton');

      const total = goodCount + badCount;
      const csat = total === 0 ? 0 : (goodCount / total) * 100;
      const formattedCSAT = csat.toFixed(2);

      resultSection.querySelector('p:nth-child(1)').textContent = `Total: ${total}`;
      resultSection.querySelector('p:nth-child(2)').textContent = `CSAT: ${formattedCSAT}%`;

      if (total === 0) {
        status.textContent = 'Enter counts to see status';
        status.className = '';
        return;
      }

      let additionalGoodNeeded = 0;
      let newCSAT = csat;
      let newGoodCount = goodCount;
      let newTotal = total;

      if (csat <= requiredCSAT) {
        while (newCSAT <= requiredCSAT) {
          additionalGoodNeeded++;
          newGoodCount = goodCount + additionalGoodNeeded;
          newTotal = total + additionalGoodNeeded;
          newCSAT = (newGoodCount / newTotal) * 100;
        }
      }

      const exactCSAT = newCSAT;

      const isAboveRequired = csat > requiredCSAT;

      if (isAboveRequired) {
        status.textContent = `Success! CSAT (${formattedCSAT}%) is above required (${requiredCSAT}%+).`;
        status.className = 'success';
      } else {
        status.textContent = `Need ${additionalGoodNeeded} more good count(s) to achieve ${requiredCSAT}%+ (exact: ${exactCSAT.toFixed(2)}%).`;
        status.className = 'error';
      }

      if (!hasCalculated) {
        hasCalculated = true;
        calculateButton.textContent = 'Recalculate';
      }
    };

    // Close CSAT Modal on Outside Click
    document.getElementById('csatModal').addEventListener('click', function(event) {
      if (event.target === this) {
        closeCSATModal();
      }
    });

    // ENDORSEMENT Full-Page Functionality
    window.openEndorsementPage = function() {
      document.getElementById('endorsementPage').style.display = 'block';
      setTimeout(() => {
        const endorsementContainer = document.querySelector('.endorsement-container');
        if (endorsementContainer) endorsementContainer.classList.add('active');
      }, 10);
      hideAllMainContent();
      // Ensure all other full-page views are hidden
      const csatModal = document.getElementById('csatModal');
      if (csatModal) csatModal.style.display = 'none';
      const manualVIPage = document.getElementById('manualVIPage');
      if (manualVIPage) manualVIPage.style.display = 'none';
      const claimCountNSTPPage = document.getElementById('claimCountNSTPPage');
      if (claimCountNSTPPage) claimCountNSTPPage.style.display = 'none';
      const inspectionWaiverPage = document.getElementById('inspectionWaiverPage');
      if (inspectionWaiverPage) inspectionWaiverPage.style.display = 'none';
      const rsaContactPage = document.getElementById('rsaContactPage');
      if (rsaContactPage) rsaContactPage.style.display = 'none';
    };

    window.closeEndorsementPage = function() {
      const endorsementPage = document.getElementById('endorsementPage');
      if (endorsementPage) endorsementPage.style.display = 'none';
      const endorsementContainer = document.querySelector('.endorsement-container');
      if (endorsementContainer) endorsementContainer.classList.remove('active');
      showAllMainContent();
    };

    // Close ENDORSEMENT Page on Outside Click
    document.getElementById('endorsementPage').addEventListener('click', function(event) {
      if (event.target === this) {
        closeEndorsementPage();
      }
    });

    // MANUAL-VI Full-Page Functionality
    window.openManualVIPage = function() {
      document.getElementById('manualVIPage').style.display = 'block';
      // Ensure the manual VI card content is visible by default when opening this page
      const manualVICardContent = document.getElementById('manualVICardContent');
      if (manualVICardContent) manualVICardContent.style.display = 'block';
      const claimCoverageOverlay = document.getElementById('claimCoverageOverlay');
      if (claimCoverageOverlay) claimCoverageOverlay.style.display = 'none'; // Hide overlay initially
      const manualVIPage = document.getElementById('manualVIPage');
      if (manualVIPage) manualVIPage.classList.remove('claim-coverage-active'); // Remove class if present
      hideAllMainContent();
      // Ensure all other full-page views are hidden
      const csatModal = document.getElementById('csatModal');
      if (csatModal) csatModal.style.display = 'none';
      const endorsementPage = document.getElementById('endorsementPage');
      if (endorsementPage) endorsementPage.style.display = 'none';
      const claimCountNSTPPage = document.getElementById('claimCountNSTPPage');
      if (claimCountNSTPPage) claimCountNSTPPage.style.display = 'none';
      const inspectionWaiverPage = document.getElementById('inspectionWaiverPage');
      if (inspectionWaiverPage) inspectionWaiverPage.style.display = 'none';
      const rsaContactPage = document.getElementById('rsaContactPage');
      if (rsaContactPage) rsaContactPage.style.display = 'none';
    };

    window.closeManualVIPage = function() {
      const manualVIPage = document.getElementById('manualVIPage');
      if (manualVIPage) manualVIPage.style.display = 'none';
      showAllMainContent();
      // Also hide the claim coverage overlay when going back to home
      const claimCoverageOverlay = document.getElementById('claimCoverageOverlay');
      if (claimCoverageOverlay) claimCoverageOverlay.style.display = 'none';
      const manualVIPageClassList = document.getElementById('manualVIPage');
      if (manualVIPageClassList) manualVIPageClassList.classList.remove('claim-coverage-active');
    };

    // Toggle Claim Coverage Overlay within Manual VI Page
    window.toggleClaimCoverage = function() {
        const manualVICardContent = document.getElementById('manualVICardContent');
        const claimCoverageOverlay = document.getElementById('claimCoverageOverlay');
        const manualVIPage = document.getElementById('manualVIPage');

        if (claimCoverageOverlay && manualVICardContent && manualVIPage) {
            if (claimCoverageOverlay.style.display === 'flex') {
                // If overlay is visible, hide it and show main card content
                claimCoverageOverlay.style.display = 'none';
                manualVICardContent.style.display = 'block';
                manualVIPage.classList.remove('claim-coverage-active'); // Remove class
            } else {
                // If overlay is hidden, show it and hide main card content
                claimCoverageOverlay.style.display = 'flex';
                manualVICardContent.style.display = 'none';
                manualVIPage.classList.add('claim-coverage-active'); // Add class for styling
            }
        }
    };

    // Close Manual VI Page OR Claim Coverage Overlay on Outside Click
    document.getElementById('manualVIPage').addEventListener('click', function(event) {
      // If the click is directly on the manual-vi-page (background),
      // regardless of which sub-section is open, close the entire page.
      if (event.target === this) {
        closeManualVIPage();
      }
    });

    // New: Add click listener to the claimCoverageOverlay to close the entire manualVIPage
    document.getElementById('claimCoverageOverlay').addEventListener('click', function(event) {
        if (event.target === this) { // Only if the click is directly on the overlay's background
            closeManualVIPage(); // Go back to the main page
        }
    });


    // New Claim_Count & NSTP Page Functionality
    window.openClaimCountNSTPPage = function() {
      document.getElementById('claimCountNSTPPage').style.display = 'block';
      hideAllMainContent();
      // Ensure all other full-page views are hidden
      const csatModal = document.getElementById('csatModal');
      if (csatModal) csatModal.style.display = 'none';
      const endorsementPage = document.getElementById('endorsementPage');
      if (endorsementPage) endorsementPage.style.display = 'none';
      const manualVIPage = document.getElementById('manualVIPage');
      if (manualVIPage) manualVIPage.style.display = 'none';
      const inspectionWaiverPage = document.getElementById('inspectionWaiverPage');
      if (inspectionWaiverPage) inspectionWaiverPage.style.display = 'none';
      const rsaContactPage = document.getElementById('rsaContactPage');
      if (rsaContactPage) rsaContactPage.style.display = 'none';
      // Populate the table when the page is opened
      populateTable(insuranceData);
      // Re-apply sort/search listeners as content is dynamic
      setupInsuranceDashboardListeners();
    };

    window.closeClaimCountNSTPPage = function() {
        const claimCountNSTPPage = document.getElementById('claimCountNSTPPage');
        if (claimCountNSTPPage) claimCountNSTPPage.style.display = 'none';
        showAllMainContent();
    };

    // Close Claim_Count & NSTP Page on Outside Click
    document.getElementById('claimCountNSTPPage').addEventListener('click', function(event) {
      if (event.target === this) {
        // Only close if the click is directly on the overlay, not on the content
        if (event.target.classList.contains('claim-count-nstp-page')) {
          closeClaimCountNSTPPage();
        }
      }
    });
    
    // New Inspection Waiver Page Functionality
    window.openInspectionWaiverPage = function() {
        document.getElementById('inspectionWaiverPage').style.display = 'block';
        hideAllMainContent();
        // Ensure all other full-page views are hidden
        const csatModal = document.getElementById('csatModal');
        if (csatModal) csatModal.style.display = 'none';
        const endorsementPage = document.getElementById('endorsementPage');
        if (endorsementPage) endorsementPage.style.display = 'none';
        const manualVIPage = document.getElementById('manualVIPage');
        if (manualVIPage) manualVIPage.style.display = 'none';
        const claimCountNSTPPage = document.getElementById('claimCountNSTPPage');
        if (claimCountNSTPPage) claimCountNSTPPage.style.display = 'none';
        const rsaContactPage = document.getElementById('rsaContactPage');
        if (rsaContactPage) rsaContactPage.style.display = 'none';
        // Add a small delay to ensure the page is fully rendered before populating
        setTimeout(() => {
            populateInspectionWaiverTable(inspectionWaiverData);
            console.log("Inspection Waiver table populated with data:", inspectionWaiverData); // Debugging log
        }, 0);
    };

    window.closeInspectionWaiverPage = function() {
        const inspectionWaiverPage = document.getElementById('inspectionWaiverPage');
        if (inspectionWaiverPage) inspectionWaiverPage.style.display = 'none';
        showAllMainContent();
    };

    // Close Inspection Waiver Page on Outside Click
    document.getElementById('inspectionWaiverPage').addEventListener('click', function(event) {
        if (event.target === this) {
            closeInspectionWaiverPage();
        }
    });

    // New RSA & Contact Page Functionality
    window.openRSAPage = function() {
        document.getElementById('rsaContactPage').style.display = 'block';
        hideAllMainContent();
        // Ensure all other full-page views are hidden
        const csatModal = document.getElementById('csatModal');
        if (csatModal) csatModal.style.display = 'none';
        const endorsementPage = document.getElementById('endorsementPage');
        if (endorsementPage) endorsementPage.style.display = 'none';
        const manualVIPage = document.getElementById('manualVIPage');
        if (manualVIPage) manualVIPage.style.display = 'none';
        const claimCountNSTPPage = document.getElementById('claimCountNSTPPage');
        if (claimCountNSTPPage) claimCountNSTPPage.style.display = 'none';
        const inspectionWaiverPage = document.getElementById('inspectionWaiverPage');
        if (inspectionWaiverPage) inspectionWaiverPage.style.display = 'none';
        // Add a small delay to ensure the page is fully rendered before populating
        setTimeout(() => {
            populateRSATable(rsaContactData);
            console.log("RSA & Contact table populated with data:", rsaContactData); // Debugging log
        }, 0);
        setupRSADashboardListeners();
    };

    window.closeRSAPage = function() {
        const rsaContactPage = document.getElementById('rsaContactPage');
        if (rsaContactPage) rsaContactPage.style.display = 'none';
        showAllMainContent();
    };

    // Close RSA & Contact Page on Outside Click
    document.getElementById('rsaContactPage').addEventListener('click', function(event) {
        if (event.target === this) {
            closeRSAPage();
        }
    });

    // Helper functions to manage visibility
    function hideAllMainContent() {
      const uploadSection = document.querySelector('.upload-section');
      if (uploadSection) uploadSection.style.display = 'none';
      const h3Element = document.querySelector('h3'); /* 'Uploaded Images' header */
      if (h3Element) h3Element.style.display = 'none';
      const gallery = document.getElementById('gallery');
      if (gallery) gallery.style.display = 'none';
      const csatBtn = document.querySelector('.csat-btn');
      if (csatBtn) csatBtn.style.display = 'none';
      const endorsementBtn = document.querySelector('.endorsement-btn');
      if (endorsementBtn) endorsementBtn.style.display = 'none';
      const manualVIBtnFixed = document.querySelector('.manual-vi-btn-fixed');
      if (manualVIBtnFixed) manualVIBtnFixed.style.display = 'none';
      const claimCountNSTPBtnFixed = document.querySelector('.claim-count-nstp-btn-fixed');
      if (claimCountNSTPBtnFixed) claimCountNSTPBtnFixed.style.display = 'none';
      const inspectionWaiverBtnFixed = document.querySelector('.inspection-waiver-btn-fixed');
      if (inspectionWaiverBtnFixed) inspectionWaiverBtnFixed.style.display = 'none';
      const rsaContactBtnFixed = document.querySelector('.rsa-contact-btn-fixed');
      if (rsaContactBtnFixed) rsaContactBtnFixed.style.display = 'none';
      const companyUpdatesButton = document.getElementById('companyUpdatesButton');
      if (companyUpdatesButton) companyUpdatesButton.style.display = 'none';
      const notebookButton = document.getElementById('notebookButton');
      if (notebookButton) notebookButton.style.display = 'none';
    }

    function showAllMainContent() {
      const uploadSection = document.querySelector('.upload-section');
      if (uploadSection) uploadSection.style.display = 'block';
      const h3Element = document.querySelector('h3'); /* 'Uploaded Images' header */
      if (h3Element) h3Element.style.display = 'block';
      const gallery = document.getElementById('gallery');
      if (gallery) gallery.style.display = 'grid'; /* grid for gallery */

      // Only show fixed buttons if not on mobile (based on media query)
      const isMobile = window.matchMedia("(max-width: 600px)").matches;
      if (!isMobile) {
        const csatBtn = document.querySelector('.csat-btn');
        if (csatBtn) csatBtn.style.display = 'block';
        const endorsementBtn = document.querySelector('.endorsement-btn');
        if (endorsementBtn) endorsementBtn.style.display = 'block';
        const manualVIBtnFixed = document.querySelector('.manual-vi-btn-fixed');
        if (manualVIBtnFixed) manualVIBtnFixed.style.display = 'block';
        const claimCountNSTPBtnFixed = document.querySelector('.claim-count-nstp-btn-fixed');
        if (claimCountNSTPBtnFixed) claimCountNSTPBtnFixed.style.display = 'block';
        const inspectionWaiverBtnFixed = document.querySelector('.inspection-waiver-btn-fixed');
        if (inspectionWaiverBtnFixed) inspectionWaiverBtnFixed.style.display = 'block';
        const rsaContactBtnFixed = document.querySelector('.rsa-contact-btn-fixed');
        if (rsaContactBtnFixed) rsaContactBtnFixed.style.display = 'block';
      }
      // Explicitly control visibility of the new updates button
      const companyUpdatesButton = document.getElementById('companyUpdatesButton');
      if (companyUpdatesButton) companyUpdatesButton.style.display = 'flex';
      const notebookButton = document.getElementById('notebookButton');
      if (notebookButton) notebookButton.style.display = 'flex';
    }

    // Endorsement Data and Logic
    const insurerDropdown = document.querySelector('.endorsement-page #insurer');
    const requirementDropdown = document.querySelector('.endorsement-page #requirement');
    const outputBox = document.querySelector('.endorsement-page #output');

    // Empty array for you to manually add JSON data for Endorsement
    const endorsementData = [
];  // Populate insurer dropdown for Endorsement
    try {
      const insurers = [...new Set(endorsementData.map(d => d["Insurer"]))].sort();
      insurers.forEach(ins => {
        const opt = document.createElement("option");
        opt.value = opt.textContent = ins;
        insurerDropdown.appendChild(opt);
      });
    } catch (error) {
      console.error("Error populating insurers for endorsement:", error);
      showMessage("Error in endorsement JSON data. Please check the syntax and paste valid JSON.", "error");
    }

    // Handle insurer selection for endorsement
    insurerDropdown.addEventListener("change", () => {
      requirementDropdown.innerHTML = "<option disabled selected>Select Requirement</option>";
      outputBox.style.display = "none";
      outputBox.classList.remove("show", "output-red");
      const selectedInsurer = insurerDropdown.value;
      const requirements = [...new Set(
        endorsementData.filter(d => d["Insurer"] === selectedInsurer)
            .map(d => d["Requirement"])
      )].sort();
      requirements.forEach(req => {
        const opt = document.createElement("option");
        opt.value = opt.textContent = req;
        requirementDropdown.appendChild(opt);
      });
      requirementDropdown.disabled = false;
    });

    // Handle requirement selection for endorsement
    requirementDropdown.addEventListener("change", () => {
      const ins = insurerDropdown.value;
      const req = requirementDropdown.value;
      const record = endorsementData.find(
        d => d["Insurer"] === ins && d["Requirement"] === req
      );
      if (record) {
        outputBox.innerHTML = `
          <div><span class="label">Endorsement Type:</span><span class="value">${record["Endorsement type"]}</span></div>
          <div><span class="label">Documents Required:</span><span class="value">${record["Documents or any other requirement"]}</span></div>
          <div><span class="label">TAT:</span><span class="value">${record["TAT"]}</span></div>
          <div><span class="label">Charges/Deduction:</span><span class="value">${record["Charges / Deduction"]}</span></div>
          <div><span class="label">Inspection:</span><span class="value">${record["Inspection"]}</span></div>
          <div><span class="label">Exception:</span><span class="value">${record["Any Exception"]}</span></div>
          <div><span class="label">Declaration Format:</span><span class="value">${record["Declaration format (if declaration required)"]}</span></div>
        `;
        if (record["Endorsement type"].toLowerCase() === "not possible") {
          outputBox.classList.add("output-red");
        } else {
          outputBox.classList.remove("output-red");
        }
        outputBox.style.display = "block";
        setTimeout(() => outputBox.classList.add("show"), 10);
      }
    });

    // Insurance Comparison Dashboard Data and Logic (from index (4).html)
    // IMPORTANT: User requested to remove this data and will add it later.
    const insuranceData = []; 
    // You will need to add your insurance data here in the future
    /*
    const insuranceData =
    // You will need to add your insurance data here in the future
    /*
    const insuranceData = [
        {
            "insurer_name": "National",
            "commercial": "Yes",
            "video_approval": "At PB end",
            "video_tat": "24 Hours",
            "short_partial": "Yes",
            "artificial_low_lighting": "No",
            "scar_declaration": "Declaration Required within Video TAT",
            "zd_claims_year": "ZD Plan: 2, ZD+: Unlimited",
            "non_zd_claims_year": "Unlimited",
            "brand_new_3_3": "No",
            "old_3_3": "No"
        },
        // ... all other 27 companies if needed];
    */

    function populateTable(data) {
        const tableBody = document.getElementById('tableBody');
        if (!tableBody) {
            console.error("Error: tableBody element not found for insuranceTable.");
            return;
        }
        tableBody.innerHTML = ''; // Clear existing rows
        if (data.length === 0) {
            // Display a message if no data is available
            tableBody.innerHTML = '<tr><td colspan="11" class="p-4 text-center text-gray-500">No insurance data available. Please add data to the "insuranceData" array in the script.</td></tr>';
            return;
        }
        data.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'table-row border-b';
            row.innerHTML = `
                <td class="p-2 font-medium text-indigo-900">${item.insurer_name}</td>
                <td class="p-2">${item.zd_claims_year}</td>
                <td class="p-2">${item.non_zd_claims_year}</td>
                <td class="p-2 ${item.commercial === 'Yes' ? 'text-green-700' : 'text-red-700'}">${item.commercial}</td>
                <td class="p-2">${item.video_approval}</td>
                <td class="p-2">${item.video_tat}</td>
                <td class="p-2 ${item.short_partial === 'Yes' ? 'text-green-700' : 'text-red-700'}">${item.short_partial}</td>
                <td class="p-2 ${item.artificial_low_lighting === 'Yes' ? 'text-green-700' : 'text-red-700'}">${item.artificial_low_lighting}</td>
                <td class="p-2">${item.scar_declaration}</td>
                <td class="p-2 ${item.brand_new_3_3 === 'Yes' ? 'text-green-700' : 'text-red-700'}">${item.brand_new_3_3}</td>
                <td class="p-2 ${item.old_3_3 === 'Yes' ? 'text-green-700' : 'text-red-700'}">${item.old_3_3}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function sortTable(column, order) {
        // Create a copy of the original data to sort, to avoid modifying the global `insuranceData` directly
        const sortedData = [...insuranceData].sort((a, b) => {
            const aValue = String(a[column]).toLowerCase(); // Ensure values are strings for comparison
            const bValue = String(b[column]).toLowerCase();

            if (order === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        populateTable(sortedData);
    }

    function setupInsuranceDashboardListeners() {
        // Remove existing listeners to prevent multiple bindings if the page is opened multiple times
        const tableHeaders = document.querySelectorAll('#insuranceTable .table-header');
        tableHeaders.forEach(header => {
            // Remove previous event listener safely by recreating the element
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
        });

        // Add event listeners to the newly (or freshly cloned) table headers
        document.querySelectorAll('#insuranceTable .table-header').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                const currentOrder = header.classList.contains('sort-asc') ? 'desc' : 'asc';

                document.querySelectorAll('#insuranceTable .table-header').forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                    h.classList.add('sort-icon'); /* Default icon wapas add karein */
                });

                header.classList.remove('sort-icon'); /* Current header se default icon hatayen */
                header.classList.add(currentOrder === 'asc' ? 'sort-asc' : 'sort-desc');

                sortTable(column, currentOrder);
            });
        });

        // Remove existing listener for search input and re-add
        const searchInput = document.getElementById('searchInput');
        // searchInput maujood hai ya nahi, check karein clone karne se pehle
        if (searchInput) {
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);

            newSearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredData = insuranceData.filter(item =>
                    item.insurer_name.toLowerCase().includes(searchTerm)
                );
                populateTable(filteredData);
            });
        }
    }

    // Data for Inspection Waiver
    const inspectionWaiverData = [
        { "Insurer Name": "Bajaj Allianz", "Policy Waiver": "Only Fresh Cases. 3 Days" },
        { "Insurer Name": "Cholamandalam", "Policy Waiver": "5 Days" },
        { "Insurer Name": "Digit", "Policy Waiver": "No Waiver" },
        { "Insurer Name": "Future Generali", "Policy Waiver": "5 Days" },
        { "Insurer Name": "Hdfc Ergo", "Policy Waiver": "No Waiver" },
        { "Insurer Name": "Icici Lombard", "Policy Waiver": "No Waiver" },
        { "Insurer Name": "Iffco Tokio", "Policy Waiver": "No Waiver" },
        { "Insurer Name": "Kotak General Insurance", "Policy Waiver": "5 Days" },
        { "Insurer Name": "Liberty General Insurance", "Policy Waiver": "No Waiver" },
        { "Insurer Name": "Magma Hdi", "Policy Waiver": "No Waiver" },
        { "Insurer Name": "National Insurance", "Policy Waiver": "5 Days" },
        { "Insurer Name": "New India Assurance", "Policy Waiver": "No Waiver" },
        { "Insurer Name": "Oriental", "Policy Waiver": "No Waiver" },
        { "Insurer Name": "Raheja Qbe", "Policy Waiver": "5 Days" },
        { "Insurer Name": "Reliance", "Policy Waiver": "1 Day" },
        { "Insurer Name": "Royal Sundaram", "Policy Waiver": "No Waiver" },
        { "Insurer Name": "SBI", "Policy Waiver": "Only In Pb Renewal 5 Days" },
        { "Insurer Name": "Shriram General Insurance", "Policy Waiver": "5 Days" },
        { "Insurer Name": "United Insurance", "Policy Waiver": "10 Days" },
        { "Insurer Name": "Universal Sompo", "Policy Waiver": "No Waiver" },
        { "Insurer Name": "Zuno", "Policy Waiver": "5 Days" }
    ];

    function populateInspectionWaiverTable(data) {
        const tableBody = document.getElementById('inspectionWaiverTableBody');
        // Check if tableBody exists before proceeding
        if (!tableBody) {
            console.error("Error: inspectionWaiverTableBody element not found.");
            return;
        }
        tableBody.innerHTML = ''; // Clear existing rows
        data.forEach(item => {
            const row = document.createElement('tr');
            const waiverText = item["Policy Waiver"].toLowerCase();
            let waiverClass = '';
            if (waiverText.includes("no waiver")) {
                waiverClass = 'no-waiver';
            } else if (waiverText.includes("days") || waiverText.includes("day")) {
                waiverClass = 'days-waiver';
            }

            row.innerHTML = `
                <td>${item["Insurer Name"]}</td>
                <td class="policy-waiver-column ${waiverClass}">${item["Policy Waiver"]}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Data for RSA & Contact
    // Function to clean numbers and replace commas with slashes
    function cleanAndFormatNumber(numberString) {
        if (!numberString) return "";
        return numberString.replace(/,/g, '/').trim();
    }

    const rsaContactData = [
        
  { "Sr.": "1", "Insurer Name": "Bajaj Allianz", "RSA and Toll Free Number": "1800 209 5858 / 1800 209 0144 / 1800 103 5858", "Claim No.": "1800 209 0144 / 1800-209-5858" },
  { "Sr.": "2", "Insurer Name": "United Insurance", "RSA and Toll Free Number": "7042113114 (Roadzen)", "Claim No.": "" },
  { "Sr.": "3", "Insurer Name": "Digit General", "RSA and Toll Free Number": "1800 258 5956 / (7026061234-whatsapp)", "Claim No.": "1800 103 4448" },
  { "Sr.": "4", "Insurer Name": "Edelweiss (Zuno)", "RSA and Toll Free Number": "22 4231 2000 / 1800 12 000", "Claim No.": "" },
  { "Sr.": "5", "Insurer Name": "Future Generali", "RSA and Toll Free Number": "1860 500 3333 / 1800 220 233 / 022 67837800", "Claim No.": "" },
  { "Sr.": "6", "Insurer Name": "HDFC Ergo", "RSA and Toll Free Number": "022 6234 6234 / 0120 6234 6234", "Claim No.": "" },
  { "Sr.": "7", "Insurer Name": "Iffco Tokio", "RSA and Toll Free Number": "1800 103 5499", "Claim No.": "" },
  { "Sr.": "8", "Insurer Name": "Kotak General Insurance", "RSA and Toll Free Number": "1800 266 4545", "Claim No.": "" },
  { "Sr.": "9", "Insurer Name": "Magma HDI", "RSA and Toll Free Number": "1800 266 3202", "Claim No.": "" },
  { "Sr.": "10", "Insurer Name": "Reliance General Insurance", "RSA and Toll Free Number": "022 4890 3009 / 1800 3009 / 022 48947020", "Claim No.": "" },
  { "Sr.": "11", "Insurer Name": "Royal Sundaram", "RSA and Toll Free Number": "1800 568 9999", "Claim No.": "" },
  { "Sr.": "12", "Insurer Name": "SBI General Insurance", "RSA and Toll Free Number": "1800 22 1111 / 1800 102 1111", "Claim No.": "" },
  { "Sr.": "13", "Insurer Name": "Shriram General Insurance", "RSA and Toll Free Number": "1800 300 30000 / 1800 103 3009", "Claim No.": "" },
  { "Sr.": "14", "Insurer Name": "TATA AIG", "RSA and Toll Free Number": "1800 266 7780", "Claim No.": "" },
  { "Sr.": "15", "Insurer Name": "Universal Sompo", "RSA and Toll Free Number": "1800 22 4030 / 1800 200 5142 / 022 27639800 / 1800 22 4090 / 1800 200 4030", "Claim No.": "" },
  { "Sr.": "16", "Insurer Name": "Raheja QBE", "RSA and Toll Free Number": "1800 102 7723", "Claim No.": "18001027723" },
  { "Sr.": "17", "Insurer Name": "Oriental Insurance", "RSA and Toll Free Number": "1800 309 1209", "Claim No.": "1800118485 / 011-33208485" },
  { "Sr.": "18", "Insurer Name": "New India Insurance", "RSA and Toll Free Number": "1800-209-1415", "Claim No.": "1800-209-1415" },
  { "Sr.": "19", "Insurer Name": "ICICI Lombard", "RSA and Toll Free Number": "1800 2666", "Claim No.": "1800 2666" },
  { "Sr.": "20", "Insurer Name": "PB_Sales Team No.", "RSA and Toll Free Number": "1800-419-7716", "Claim No.": "" },
  { "Sr.": "21", "Insurer Name": "PB_Claim Team NO.", "RSA and Toll Free Number": "1800-258-5881", "Claim No.": "" },
  { "Sr.": "22", "Insurer Name": "PB_What's App No.", "RSA and Toll Free Number": "8506013131", "Claim No.": "" },
  { "Sr.": "23", "Insurer Name": "PB_Service Team No.", "RSA and Toll Free Number": "1800-258-5970", "Claim No.": "" },
  { "Sr.": "24", "Insurer Name": "PB_Health Renewal Team No.", "RSA and Toll Free Number": "1800-572-3919", "Claim No.": "" },
  { "Sr.": "25", "Insurer Name": "PB_Health Sales Team No.", "RSA and Toll Free Number": "1800-419-7715", "Claim No.": "" },
  { "Sr.": "26", "Insurer Name": "PB_Car Motor Sales Team No.", "RSA and Toll Free Number": "1800-419--7716", "Claim No.": "" },
  { "Sr.": "27", "Insurer Name": "PB_Term/Jeevan Bima Sales Team No.", "RSA and Toll Free Number": "1800-419-7713", "Claim No.": "" },
  { "Sr.": "28", "Insurer Name": "PB_Investment Sales Team No.", "RSA and Toll Free Number": "1800-419-7717", "Claim No.": "" },
  { "Sr.": "29", "Insurer Name": "PB_Travel Sales Team No.", "RSA and Toll Free Number": "1800-419-7824", "Claim No.": "" },
  { "Sr.": "30", "Insurer Name": "PB_Corporate Sales Team No.", "RSA and Toll Free Number": "1800-309-0988", "Claim No.": "" },
  { "Sr.": "31", "Insurer Name": "PB_Corporate Service Team No.", "RSA and Toll Free Number": "1800-572-3918", "Claim No.": "" },
  { "Sr.": "32", "Insurer Name": "PB_Home Insurance Team No.", "RSA and Toll Free Number": "1800-258-7202", "Claim No.": "" },
  { "Sr.": "33", "Insurer Name": "PB_Commercial Vehicle Sales Team No.", "RSA and Toll Free Number": "0124-6108850", "Claim No.": "" },
  { "Sr.": "34", "Insurer Name": "PB_Service Email Id", "RSA and Toll Free Number": "CARE@POLICYBAZAAR.COM", "Claim No.": "" },
  { "Sr.": "35", "Insurer Name": "PB_NRI Team No.", "RSA and Toll Free Number": "0124-6656507", "Claim No.": "" },
  { "Sr.": "36", "Insurer Name": "PB Partner Agent Team No.", "RSA and Toll Free Number": "1800-120-800", "Claim No.": "" },
  { "Sr.": "37", "Insurer Name": "PB_Mail", "RSA and Toll Free Number": "SUPPORT@PBPARTNER.COM", "Claim No.": "" },
  { "Sr.": "38", "Insurer Name": "Paisa Bazaar.com Team No.", "RSA and Toll Free Number": "1800-208-8877", "Claim No.": "" },
  { "Sr.": "39", "Insurer Name": "PB_2W Renewal Team No.", "RSA and Toll Free Number": "0124-6138301", "Claim No.": "" }

    ];

    function populateRSATable(data) {
        const tableBody = document.getElementById('rsaContactTableBody');
        // Check if tableBody exists before proceeding
        if (!tableBody) {
            console.error("Error: rsaContactTableBody element not found.");
            return;
        }
        tableBody.innerHTML = ''; // Clear existing rows
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500">No RSA & Contact data available.</td></tr>';
            return;
        }
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item["Sr."]}</td>
                <td>${item["Insurer Name"]}</td>
                <td>${cleanAndFormatNumber(item["RSA and Toll Free Number"])}</td>
                <td>${cleanAndFormatNumber(item["Claim No."])}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function setupRSADashboardListeners() {
        // Remove existing listener for search input and re-add
        const rsaSearchInput = document.getElementById('rsaSearchInput');
        if (rsaSearchInput) {
            const newRSASearchInput = rsaSearchInput.cloneNode(true);
            rsaSearchInput.parentNode.replaceChild(newRSASearchInput, rsaSearchInput);

            newRSASearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredData = rsaContactData.filter(item =>
                    item["Insurer Name"].toLowerCase().includes(searchTerm) ||
                    cleanAndFormatNumber(item["RSA and Toll Free Number"]).toLowerCase().includes(searchTerm) ||
                    cleanAndFormatNumber(item["Claim No."]).toLowerCase().includes(searchTerm)
                );
                populateRSATable(filteredData);
            });
        }
    }


    // Page load hone par images ko shuruat mein load karein
    loadImages();

    // --- NEW JAVASCRIPT FOR UPDATES BUTTON AND MODAL ---
    document.addEventListener('DOMContentLoaded', function() {
        const updatesButton = document.getElementById('companyUpdatesButton');
        const updatesModal = document.getElementById('updatesModal');
        const closeModalButton = document.getElementById('closeModalButton');
        const updatesContainer = document.getElementById('updatesContainer');
        const latestUpdateSnippetElem = document.getElementById('latestUpdateSnippet');
        const newUpdateIndicator = document.getElementById('newUpdateIndicator');

        // --- IMPORTANT: DAILY UPDATES DATA SECTION (दैनिक अपडेट डेटा सेक्शन) ---
        // YAHAN AAP APNE DAILY UPDATES DALEIN. (यहां आप अपने दैनिक अपडेट डालें।)
        // Har company ke liye, updates ko array ke andar dalien. (हर कंपनी के लिए, अपडेट को एरे के अंदर डालें।)
        // Naye updates ko array ke shuruat (top) mein dalien, taaki woh pehle dikhein. (नए अपडेट को एरे की शुरुआत (शीर्ष) में डालें, ताकि वह पहले दिखें।)
        // Format: { date: "YYYY-MM-DD", update: "Your update text here" } (फॉर्मेट: { date: "YYYY-MM-DD", update: "आपका अपडेट टेक्स्ट यहां" })
        const companyUpdates = {
            "National": [],
            "New India Assurance": [],
            "Oriental": [],
            "United India": [],
            "Tata AIG": [{
  "date": "2025-06-30",
  "update": "TATA AIG Battery Protection Cover 1. Applicable for EV vehicles 2. Covers damage to battery, drive motor/electric motor, and includes chargers & cables as well (up to the IDV) 3. Provides coverage for water ingression, short circuit, or damages from accidental external factors 4. Counted as a claim 5. Allowed 2 times in a policy year"
}
],
            "ICICI Lombard": [{
  "date": "2025-06-30",
  "update": "ICICI Lombard Battery Protection 1. Provides coverage for damages arising from water ingression or short circuits, resulting in loss or damage to the battery, drive motor/electric motor, and HEV (Hybrid Electric Vehicle) system 2. Coverage extends up to the Insured Declared Value (IDV) 3. Counted as a claim with a limit of 1 time per policy year 4. Charging cables and chargers are not included under this protection cover 5. Applicable for both Hybrid and EV vehicles"
}
],
            "Zuno General": [],
            "Cholamandalam MS": [],
            "Future Generali": [],
            "Magma": [],
            "Raheja QBE": [],
            "Kotak": [],
            "SBI General": [{ date: "2025-08-11", update: "For all Pre issuance rejection: Please mark an email to customer regarding the refund process of 7 working days from the date of rejection" }],
            "Shriram": [],
            "IFFCO Tokio": [],
            "Liberty Videocon": [],
            "HDFC Ergo": [],
            "Reliance": [
                { date: "2025-06-12", update: "Unmasked KYC documents (Aadhar and PAN card) are needed for KYC in Reliance. Please ask the CX to share Aadhar card through Email." }
            ],
            "Bajaj Allianz": [],
            "Royal Sundaram": [],
            "Universal Sompo": [],
            "Digit": [{ date: "2025-06-12", update: "if cx comes for odometere update in DIGIT , THese 4 things needs to be captured:- odomeret reading, engraved, chasis number, 360 degree view and Engiene compartment" },{
  "date": "2025-06-30",
  "update": "Digit Battery Protection Add-on 1. Applicable for both Hybrid and EV vehicles 2. Covers damage to battery, drive motor/electric motor, and Hybrid Electric Vehicle (HEV), including chargers and cables as well (up to the IDV) 3. Provides coverage for water ingression, short circuit, or damages from accidental external factors 4. Counted as a claim 5. Allowed 2 times in a policy year"
},{ date: "2025-08-11", update: "For all Pre issuance rejection: Please mark an email to customer regarding the refund process of 7 working days from the date of rejection" }],
            "BAJAJ CPA": [],
            "DIGIT CPA": [],
            "CHOLA CPA": [],
            "KOTAK CPA": [],
            "RELIENCE CPA": [],
            "LIBERTY CPA": []
        };
        // --- END OF DAILY UPDATES DATA SECTION ---


        // This variable will hold the snippet for display on the button.
        let latestUpdateSnippetText = "";
        let hasNewUpdate = false;

        // Find the most recent update among all companies for the button snippet
        // This will pick the first company in the list that has an update.
        // If no updates are present in any company, hasNewUpdate will remain false.
        // Sort all updates by date in descending order to get the latest one
        const allUpdates = [];
        for (const company in companyUpdates) {
            if (companyUpdates.hasOwnProperty(company)) {
                companyUpdates[company].forEach(updateItem => {
                    allUpdates.push({ company: company, date: updateItem.date, update: updateItem.update });
                });
            }
        }

        allUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (allUpdates.length > 0) {
            const mostRecentUpdate = allUpdates[0];
            latestUpdateSnippetText = `${mostRecentUpdate.company}: ${mostRecentUpdate.update}`;
            hasNewUpdate = true;
        }


        // Function to display the modal
        function showUpdatesModal() {
            if (updatesModal) updatesModal.classList.add('active');
            populateUpdates(); // Populate updates when modal opens
            // After showing, mark as seen for this session
            sessionStorage.setItem('updatesSeen', 'true');
            hideNewUpdateIndicatorAndSnippet(); // Hide indicator once modal is opened
            hideAllMainContent(); // Hide other main content when updates modal is open
        }

        // Function to hide the modal
        function closeUpdatesModal() {
            if (updatesModal) updatesModal.classList.remove('active');
            showAllMainContent(); // Show other main content when updates modal is closed
        }

        // Function to populate the updates in an accordion style
        function populateUpdates() {
            if (!updatesContainer) {
                console.error("Error: updatesContainer element not found.");
                return;
            }
            updatesContainer.innerHTML = ''; // Clear previous content
            // Dynamically add all company names as accordion headers
            const allCompanies = [
                "National", "New India Assurance", "Oriental", "United India", "Tata AIG",
                "ICICI Lombard", "Zuno General", "Cholamandalam MS", "Future Generali",
                "Magma", "Raheja QBE", "Kotak", "SBI General", "Shriram", "IFFCO Tokio",
                "Liberty Videocon", "HDFC Ergo", "Reliance", "Bajaj Allianz", "Royal Sundaram",
                "Universal Sompo", "Digit", "BAJAJ CPA", "DIGIT CPA", "CHOLA CPA",
                "KOTAK CPA", "RELIENCE CPA", "LIBERTY CPA"
            ];

            allCompanies.forEach(company => {
                const companyUpdatesList = companyUpdates[company] || []; // Use empty array if company not in data
                // Sort updates for each company by date descending
                companyUpdatesList.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                const accordionItem = document.createElement('div');
                accordionItem.classList.add('accordion-item');

                const accordionHeader = document.createElement('div');
                accordionHeader.classList.add('accordion-header');
                accordionHeader.textContent = company; // Company name is always set
                accordionHeader.dataset.company = company; // Store company name for identifier

                const accordionContent = document.createElement('div');
                accordionContent.classList.add('accordion-content');
                const ul = document.createElement('ul');

                if (companyUpdatesList.length === 0) {
                    const li = document.createElement('li');
                    li.textContent = "No updates available yet."; // This text is added if no updates
                    ul.appendChild(li);
                } else {
                    companyUpdatesList.forEach(updateItem => {
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>${updateItem.date}:</strong> ${updateItem.update}`;
                        ul.appendChild(li);
                    });
                }
                
                accordionContent.appendChild(ul);
                accordionItem.appendChild(accordionHeader);
                accordionItem.appendChild(accordionContent);
                updatesContainer.appendChild(accordionItem);
            });

            // Add event listeners to all accordion headers
            document.querySelectorAll('.accordion-header').forEach(header => {
                header.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    // Toggle active class on header
                    this.classList.toggle('active');
                    // Toggle active class on content to control max-height and padding
                    content.classList.toggle('active');
                });
            });
        }

        // --- New Update Indicator Logic ---
        function showNewUpdateIndicatorAndSnippet() {
            // If there's an update and it hasn't been seen in this session
            if (hasNewUpdate && !sessionStorage.getItem('updatesSeen')) {
                if (latestUpdateSnippetElem) latestUpdateSnippetElem.textContent = latestUpdateSnippetText;
                if (newUpdateIndicator) newUpdateIndicator.style.display = 'block'; // Show the pulsating dot
            } else {
                if (latestUpdateSnippetElem) latestUpdateSnippetElem.textContent = ''; // Clear snippet
                if (newUpdateIndicator) newUpdateIndicator.style.display = 'none';
            }
        }

        function hideNewUpdateIndicatorAndSnippet() {
            if (latestUpdateSnippetElem) latestUpdateSnippetElem.textContent = '';
            if (newUpdateIndicator) newUpdateIndicator.style.display = 'none';
        }

        // --- Event Listeners for the New Updates Feature ---
        if (updatesButton) updatesButton.addEventListener('click', showUpdatesModal);
        if (closeModalButton) closeModalButton.addEventListener('click', closeUpdatesModal);
        // Close modal if clicked directly on the overlay background
        if (updatesModal) {
            updatesModal.addEventListener('click', function(event) {
                if (event.target === updatesModal) { // Only closes if clicked on the dark background
                    closeUpdatesModal();
                }
            });
        }

        // Initial call to display new update indicator/snippet on page load
        showNewUpdateIndicatorAndSnippet();
    });
// Fill AHT dropdowns
window.onload = function() {
  let minSelect = document.getElementById("incentiveAHTMin");
  let secSelect = document.getElementById("incentiveAHTSec");

  for (let i = 2; i <= 7; i++) {
    minSelect.innerHTML += `<option value="${i}">${i} Min</option>`;
  }
  for (let i = 0; i < 60; i += 10) {
    secSelect.innerHTML += `<option value="${i}">${i} Sec</option>`;
  }
};

// Open Modal
window.openIncentiveModal = function() {
  document.getElementById("incentiveModal").style.display = "flex";
};

// Close Modal
window.closeIncentiveModal = function() {
  document.getElementById("incentiveModal").style.display = "none";
};

// Logic
window.calculateIncentive = function() {
  let csat = parseInt(document.getElementById("incentiveCSAT").value);
  let quality = parseInt(document.getElementById("incentiveQuality").value);
  let min = parseInt(document.getElementById("incentiveAHTMin").value);
  let sec = parseInt(document.getElementById("incentiveAHTSec").value);
  let escalation = document.getElementById("escalation").value;
  let ul = parseInt(document.getElementById("ul").value);
  let warning = parseInt(document.getElementById("warning").value);

  let aht = min * 60 + sec; // total seconds

  // 1. CSAT Slab
  let base = 0;
  if (csat < 85) base = 0;
  else if (csat < 87) base = 2000;
  else if (csat < 90) base = 5000;
  else if (csat < 92) base = 6000;
  else if (csat < 95) base = 7000;
  else if (csat < 97) base = 8000;
  else base = 10000;
  base = base * 0.7; // 70%

  // 2. Quality Bonus
  let qBonus = 0;
  if (quality < 80) { 
    document.getElementById("incentiveResult").innerHTML = "<p style='color:red;'>❌ Incentive Cancelled (Quality < 80%)</p>";
    return;
  } else if (quality < 85) qBonus = 0;
  else if (quality < 90) qBonus = 1000;
  else qBonus = 2500;

  // 3. AHT Bonus
  let ahtBonus = 0;
  if (aht <= 230) ahtBonus = 2500; // <3:50
  else if (aht <= 270) ahtBonus = 1000; // 3:50–4:30
  else if (aht <= 285) ahtBonus = 500; // 4:30–4:45
  else ahtBonus = 0;

  let final = base + qBonus + ahtBonus;

  // 4. Deductions
  if (warning >= 1) final = 0;
  else {
    if (escalation == "1") final *= 0.75;
    else if (escalation == "2") final *= 0.5;
    final *= (1 - (ul * 0.1));
  }

  document.getElementById("incentiveResult").innerHTML = `
    <p>💰 Final Incentive: <b>₹${final.toFixed(0)}</b></p>
  `;
};
