// ==UserScript==
// @name         LearnableMeta to Anki
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Extract content from LearnableMeta to quickly create Anki decks to aid with memorisation.
// @author       NeuroForgeStudios <https://github.com/NeuroforgeStudios>
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      localhost
// @connect      127.0.0.1
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        ankiConnectPort: 8765,
        defaultDeckName: "LearnableMeta",
        defaultModelName: "Basic",
        fastAddEnabled: GM_getValue('fastAddEnabled', false),
        allowDuplicates: GM_getValue('allowDuplicates', true),
        addTimestamp: GM_getValue('addTimestamp', false),
        debugMode: true
    };

    // Console logging
    const log = {
        info: function(msg, data) {
            if (CONFIG.debugMode) {
                console.log(`[LM-Anki] ${msg}`, data || '');
            }
        },
        error: function(msg, err) {
            console.error(`[LM-Anki] ${msg}`, err || '');
        }
    };

    // Check if we're on LearnableMeta
    function isLearnableMetaPage() {
        // Check if "Learnable Meta" is in the title or URL
        return document.title.includes("Learnable Meta") ||
               document.title.includes("LearnableMeta") ||
               window.location.href.includes("learnable") && window.location.href.includes("meta");
    }

    // If not on LearnableMeta, don't run the script
    if (!isLearnableMetaPage()) {
        log.info("Not on LearnableMeta site, script disabled");
        return;
    }

    log.info("LearnableMeta to Anki script started");

    // Add CSS with modernized UI
    GM_addStyle(`
        /* CSS Variables for consistent styling */
        :root {
            --primary-color: #4CAF50; /* Green color matching the site */
            --primary-hover: #3d9140; /* Darker green for hover */
            --secondary-color: #007bff; /* Blue for secondary button */
            --secondary-hover: #0069d9; /* Darker blue for hover */
            --tertiary-color: #6c757d; /* Gray for tertiary button */
            --tertiary-hover: #5a6268; /* Darker gray for hover */
            --button-text: white;
            --button-radius: 6px; /* Slightly rounded corners */
            --button-shadow: 0 2px 4px rgba(0,0,0,0.1);
            --button-hover-shadow: 0 4px 8px rgba(0,0,0,0.15);
            --transition-speed: 0.2s;
            --spacing-unit: 8px;
            --button-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --modal-bg: #ffffff;
            --modal-shadow: 0 4px 20px rgba(0,0,0,0.2);
            --border-color: #e0e0e0;
            --text-color: #333333;
            --light-bg: #f8f9fa;
        }

        /* Button container */
        .lm-anki-button-container {
            position: fixed;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition: all 0.3s ease;
            right: 20px;
            top: 90px; /* Position below the site header */
        }

        /* Button base styles */
        .lm-anki-button {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 10px 16px;
            font-family: var(--button-font);
            font-size: 14px;
            font-weight: 500;
            border: none;
            border-radius: var(--button-radius);
            color: var(--button-text);
            background-color: var(--primary-color);
            box-shadow: var(--button-shadow);
            cursor: pointer;
            transition: all var(--transition-speed) ease;
            white-space: nowrap;
            text-align: left;
            min-width: 160px;
            opacity: 0.95;
        }

        /* Button hover and active states */
        .lm-anki-button:hover {
            transform: translateY(-1px);
            box-shadow: var(--button-hover-shadow);
            opacity: 1;
        }

        .lm-anki-button:active {
            transform: translateY(1px);
            box-shadow: var(--button-shadow);
        }

        /* Button variants */
        .lm-anki-button.primary {
            background-color: var(--primary-color);
        }

        .lm-anki-button.primary:hover {
            background-color: var(--primary-hover);
        }

        .lm-anki-button.secondary {
            background-color: var(--secondary-color);
        }

        .lm-anki-button.secondary:hover {
            background-color: var(--secondary-hover);
        }

        .lm-anki-button.tertiary {
            background-color: var(--tertiary-color);
        }

        .lm-anki-button.tertiary:hover {
            background-color: var(--tertiary-hover);
        }

        /* Button icon styles */
        .lm-anki-button-icon {
            margin-right: 10px;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Modal styles */
        .lm-anki-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(3px);
        }

        .lm-anki-modal-content {
            background-color: var(--modal-bg);
            width: 80%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            border-radius: 8px;
            padding: 24px;
            position: relative;
            box-shadow: var(--modal-shadow);
        }

        .lm-anki-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 12px;
        }

        .lm-anki-modal-title {
            margin: 0;
            font-size: 1.5em;
            color: var(--text-color);
            font-weight: 600;
        }

        .lm-anki-btn-cancel {
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: var(--button-radius);
            padding: 8px 16px;
            cursor: pointer;
            font-weight: 500;
            margin-right: 10px;
            transition: all var(--transition-speed) ease;
        }

        .lm-anki-btn-cancel:hover {
            background-color: #d32f2f;
        }

        .lm-anki-btn-submit {
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: var(--button-radius);
            padding: 8px 16px;
            cursor: pointer;
            font-weight: 500;
            transition: all var(--transition-speed) ease;
        }

        .lm-anki-btn-submit:hover {
            background-color: var(--primary-hover);
        }

        .lm-anki-preview-content {
            border: 1px solid var(--border-color);
            padding: 20px;
            margin: 15px 0;
            border-radius: 6px;
        }

        .lm-anki-card-side {
            padding: 15px;
            background-color: var(--light-bg);
            border-radius: 6px;
            margin: 10px 0;
        }

        .lm-anki-front {
            border-left: 4px solid var(--primary-color);
        }

        .lm-anki-back {
            border-left: 4px solid var(--secondary-color);
        }

        .lm-anki-preview-image {
            max-width: 100%;
            max-height: 300px;
            margin-top: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .lm-anki-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 6px;
            color: white;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.3s;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            font-family: var(--button-font);
        }

        .lm-anki-notification.success {
            background-color: var(--primary-color);
        }

        .lm-anki-notification.error {
            background-color: #f44336;
        }

        .lm-anki-notification.visible {
            opacity: 1;
        }

        .lm-anki-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }

        .lm-anki-checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            margin-top: 10px;
            font-family: var(--button-font);
        }

        .lm-anki-checkbox {
            margin-right: 8px;
            cursor: pointer;
        }

        .lm-anki-settings-section {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--border-color);
        }

        .lm-anki-settings-title {
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--text-color);
        }

        /* Responsive styles for mobile devices */
        @media (max-width: 768px) {
            .lm-anki-button-container {
                top: auto;
                bottom: 20px;
                right: 20px;
            }

            /* Menu button and collapsed state */
            .lm-anki-menu-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 48px;
                height: 48px;
                border-radius: 24px;
                background-color: var(--primary-color);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: var(--button-shadow);
                z-index: 10000;
                transition: all 0.3s ease;
            }

            .lm-anki-menu-button:hover {
                background-color: var(--primary-hover);
                box-shadow: var(--button-hover-shadow);
            }

            /* Collapsed state */
            .lm-anki-button-container.collapsed {
                pointer-events: none;
                opacity: 0;
                transform: translateY(20px);
            }

            .lm-anki-button-container.expanded {
                pointer-events: auto;
                opacity: 1;
                transform: translateY(0);
            }

            /* Make buttons more compact on mobile */
            .lm-anki-button {
                min-width: auto;
                padding: 8px 12px;
            }

            .lm-anki-modal-content {
                width: 95%;
                padding: 16px;
            }
        }
    `);

    // Extract content from page using targeted selectors
    function extractPageContent() {
        log.info("Extracting content from page");

        // Extract title - look specifically for the h3 with Tailwind classes
        let title = '';
        const h3Elements = document.querySelectorAll('h3.text-2xl.font-bold.mb-4.text-gray-900.text-center');

        if (h3Elements.length > 0) {
            title = h3Elements[0].textContent.trim();
            log.info("Extracted title from h3 element:", title);
        } else {
            // Fallback to other title extraction methods
            title = document.querySelector('h1')?.textContent ||
                    document.title.replace(' - Learnable Meta', '').trim();
            log.info("Extracted title from fallback:", title);
        }

        // Extract description - look for the first paragraph after the h3 title
        let description = '';
        if (h3Elements.length > 0) {
            // Find sibling paragraph or closest paragraph after the title
            const h3Element = h3Elements[0];

            // Try first sibling paragraph
            let nextElement = h3Element.nextElementSibling;
            while (nextElement) {
                if (nextElement.tagName === 'P') {
                    description = nextElement.textContent.trim();
                    log.info("Found paragraph after title:", description);
                    break;
                }

                // Check if it has paragraphs inside
                const paragraphs = nextElement.querySelectorAll('p');
                if (paragraphs.length > 0) {
                    description = paragraphs[0].textContent.trim();
                    log.info("Found nested paragraph:", description);
                    break;
                }

                nextElement = nextElement.nextElementSibling;
            }

            // If still no description, try parent container's paragraphs
            if (!description) {
                const parentElement = h3Element.parentElement;
                if (parentElement) {
                    const paragraphs = parentElement.querySelectorAll('p');
                    for (const p of paragraphs) {
                        const text = p.textContent.trim();
                        if (text.length > 30 && !text.includes('Check out') && !text.includes('http')) {
                            description = text;
                            log.info("Found paragraph in parent container:", description);
                            break;
                        }
                    }
                }
            }
        }

        // If still no description, try various fallbacks
        if (!description) {
            log.info("No description found after title, trying fallbacks");

            // Find any meaningful paragraph
            const paragraphs = document.querySelectorAll('p');
            for (const p of paragraphs) {
                const text = p.textContent.trim();
                if (text.length > 30 && !text.includes('Check out') && !text.includes('http')) {
                    description = text;
                    log.info("Found fallback paragraph:", description);
                    break;
                }
            }

            // Last resort: get all text content from the main part of the page
            if (!description) {
                const mainContent = document.querySelector('main') || document.querySelector('.content') || document.body;

                // Clone to prevent modifications to the original
                const contentClone = mainContent.cloneNode(true);

                // Remove unwanted elements
                const unwantedSelectors = [
                    'nav', 'header', 'footer', 'script', 'style',
                    'iframe', 'button', 'aside', '.sidebar', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
                ];

                unwantedSelectors.forEach(selector => {
                    const elements = contentClone.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el.parentNode) el.parentNode.removeChild(el);
                    });
                });

                description = contentClone.textContent.replace(/\s+/g, ' ').trim();

                // Try to limit it to a reasonable length
                if (description.length > 300) {
                    description = description.substring(0, 300) + '...';
                }

                log.info("Generated description from remaining content:", description);
            }
        }

        // Extract images - first look for images after the title
        const images = [];

        if (h3Elements.length > 0) {
            const h3Element = h3Elements[0];
            let currentElement = h3Element.nextElementSibling;

            // Look through siblings for images
            while (currentElement) {
                const imgElements = currentElement.querySelectorAll('img');

                if (imgElements.length > 0) {
                    for (const img of imgElements) {
                        if (img.src && img.width > 100 && img.height > 100 &&
                            !img.src.includes('avatar') && !img.src.includes('logo')) {
                            images.push(img.src);
                        }
                    }
                }

                currentElement = currentElement.nextElementSibling;
            }

            // If no images found in siblings, check parent containers
            if (images.length === 0) {
                const parentContainer = h3Element.closest('div') || h3Element.parentElement;
                if (parentContainer) {
                    const imgElements = parentContainer.querySelectorAll('img');
                    for (const img of imgElements) {
                        if (img.src && img.width > 100 && img.height > 100 &&
                            !img.src.includes('avatar') && !img.src.includes('logo')) {
                            images.push(img.src);
                        }
                    }
                }
            }
        }

        // If still no images, look throughout the page
        if (images.length === 0) {
            // Try to get all meaningful images
            document.querySelectorAll('img').forEach(img => {
                if (img.src &&
                    !img.src.includes('avatar') &&
                    !img.src.includes('logo') &&
                    !img.src.includes('favicon') &&
                    img.width > 100 && img.height > 100) {
                    images.push(img.src);
                }
            });
        }

        log.info("Extracted images:", images);

        return {
            title,
            description,
            images,
            url: window.location.href
        };
    }

    // Show notification
    function showNotification(message, type = 'success', duration = 3000) {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.lm-anki-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `lm-anki-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Force reflow
        notification.offsetHeight;

        // Make visible
        notification.classList.add('visible');

        // Auto hide after duration
        setTimeout(() => {
            notification.classList.remove('visible');

            // Remove after fade out
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    // Call AnkiConnect API
    async function invokeAnkiConnect(action, params = {}) {
        log.info(`Invoking AnkiConnect: ${action}`, params);

        const request = {
            action,
            version: 6,
            params
        };

        try {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `http://localhost:${CONFIG.ankiConnectPort}`,
                    data: JSON.stringify(request),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    onload: function(response) {
                        try {
                            const result = JSON.parse(response.responseText);
                            if (result.error) {
                                reject(new Error(result.error));
                            } else {
                                resolve(result.result);
                            }
                        } catch (e) {
                            reject(new Error('Invalid response from AnkiConnect'));
                        }
                    },
                    onerror: function(error) {
                        reject(new Error('Failed to connect to AnkiConnect'));
                    },
                    ontimeout: function() {
                        reject(new Error('AnkiConnect request timed out'));
                    }
                });
            });
        } catch (error) {
            log.error(`AnkiConnect error (${action}):`, error);
            throw error;
        }
    }

    // Fetch image as base64
    async function fetchImageAsBase64(url) {
        log.info('Fetching image:', url);

        try {
            // If already a data URL, return it
            if (url.startsWith('data:')) return url;

            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    responseType: 'blob',
                    onload: function(response) {
                        if (response.status >= 200 && response.status < 300) {
                            const reader = new FileReader();
                            reader.onloadend = function() {
                                resolve(reader.result);
                            };
                            reader.onerror = function() {
                                reject(new Error('Failed to convert image to base64'));
                            };
                            reader.readAsDataURL(response.response);
                        } else {
                            reject(new Error(`Failed to fetch image: ${response.status}`));
                        }
                    },
                    onerror: function(error) {
                        reject(new Error('Failed to fetch image: Network error'));
                    }
                });
            });
        } catch (error) {
            log.error('Image fetch failed:', error);
            throw error;
        }
    }

    // Send content to Anki
    async function sendToAnki(content) {
        try {
            log.info('Sending to Anki:', content);

            // Check if Anki is available
            const version = await invokeAnkiConnect('version');
            log.info('AnkiConnect version:', version);

            // Get a list of decks
            const decks = await invokeAnkiConnect('deckNames');
            log.info('Available decks:', decks);

            // Create deck if it doesn't exist
            if (!decks.includes(CONFIG.defaultDeckName)) {
                await invokeAnkiConnect('createDeck', {
                    deck: CONFIG.defaultDeckName
                });
                log.info(`Created deck: ${CONFIG.defaultDeckName}`);
            }

            // Get model fields
            const fields = await invokeAnkiConnect('modelFieldNames', {
                modelName: CONFIG.defaultModelName
            });
            log.info('Model fields:', fields);

            // Find appropriate fields for front, back, and image
            const frontField = fields.includes('Front') ? 'Front' : fields[0];
            const backField = fields.includes('Back') ? 'Back' : fields[1] || fields[0];

            log.info(`Using fields - Front: ${frontField}, Back: ${backField}`);

            // Prepare note fields
            const noteFields = {};

            // Process image if available
            let imageFilename = null;
            if (content.images && content.images.length > 0) {
                try {
                    // Get the first image
                    const imageUrl = content.images[0];

                    // Get image filename - add timestamp to avoid conflicts
                    const originalFilename = imageUrl.split('/').pop().split('?')[0];
                    const timestamp = Date.now();
                    const extension = originalFilename.split('.').pop() || 'jpg';
                    imageFilename = `learnable_meta_${timestamp}.${extension}`;

                    // Fetch the image as base64
                    const imageData = await fetchImageAsBase64(imageUrl);

                    // Extract base64 data without prefix
                    const base64Data = imageData.split(',')[1];

                    // Store the image in Anki's media folder
                    await invokeAnkiConnect('storeMediaFile', {
                        filename: imageFilename,
                        data: base64Data
                    });

                    log.info(`Stored image as: ${imageFilename}`);
                } catch (imageError) {
                    log.error('Error processing image:', imageError);
                    // Fall back to direct URL
                    imageFilename = null;
                }
            }

            // Front field: image only
            if (imageFilename) {
                noteFields[frontField] = `<img src="${imageFilename}">`;
            } else if (content.images && content.images.length > 0) {
                noteFields[frontField] = `<img src="${content.images[0]}">`;
            } else {
                // Fallback if no image available
                noteFields[frontField] = content.title;
            }

            // Back field: title and description
            // Back field: title and description with capitalized, bold title and extra spacing
            noteFields[backField] = `<b>${content.title.toUpperCase()}</b><br><br>${content.description}`;

            // Add timestamp if configured
            if (CONFIG.addTimestamp) {
                noteFields[backField] += `\n\n[${new Date().toLocaleString()}]`;
            }

            // Create the note with duplicate handling option
            const noteId = await invokeAnkiConnect('addNote', {
                note: {
                    deckName: CONFIG.defaultDeckName,
                    modelName: CONFIG.defaultModelName,
                    fields: noteFields,
                    tags: ['LearnableMeta'],
                    options: {
                        allowDuplicate: CONFIG.allowDuplicates
                    }
                }
            });

            log.info('Note created with ID:', noteId);
            showNotification('Card added to Anki successfully!');
            return noteId;

        } catch (error) {
            log.error('Error sending to Anki:', error);

            // Check for duplicate error and show more helpful message
            if (error.message && error.message.includes('duplicate')) {
                showNotification('Error: Card already exists. Enable "Allow Duplicates" in settings.', 'error');
            } else {
                showNotification(`Error: ${error.message}`, 'error');
            }

            throw error;
        }
    }

    // Show settings modal
    function showSettingsModal() {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'lm-anki-modal';

        // Create content container
        const modalContent = document.createElement('div');
        modalContent.className = 'lm-anki-modal-content';

        // Add content with header (no X button)
        let html = `
            <div class="lm-anki-modal-header">
                <h2 class="lm-anki-modal-title">LearnableMeta Anki Settings</h2>
            </div>

            <div class="lm-anki-settings-section">
                <div class="lm-anki-settings-title">Anki Connection</div>
                <div class="lm-anki-checkbox-label">
                    <label>AnkiConnect Port:
                        <input type="number" id="lm-anki-port" value="${CONFIG.ankiConnectPort}" style="width: 80px; margin-left: 10px;">
                    </label>
                </div>
                <div class="lm-anki-checkbox-label">
                    <label>Deck Name:
                        <input type="text" id="lm-anki-deck" value="${CONFIG.defaultDeckName}" style="width: 200px; margin-left: 10px;">
                    </label>
                </div>
            </div>

            <div class="lm-anki-settings-section">
                <div class="lm-anki-settings-title">Duplicate Handling</div>
                <div class="lm-anki-checkbox-label">
                    <input type="checkbox" class="lm-anki-checkbox" id="lm-allow-duplicates" ${CONFIG.allowDuplicates ? 'checked' : ''}>
                    <label for="lm-allow-duplicates">Allow Duplicate Cards</label>
                </div>
                <div class="lm-anki-checkbox-label">
                    <input type="checkbox" class="lm-anki-checkbox" id="lm-add-timestamp" ${CONFIG.addTimestamp ? 'checked' : ''}>
                    <label for="lm-add-timestamp">Add Timestamp to Card</label>
                </div>
            </div>

            <div class="lm-anki-settings-section">
                <div class="lm-anki-settings-title">Quick Actions</div>
                <div class="lm-anki-checkbox-label">
                    <input type="checkbox" class="lm-anki-checkbox" id="lm-fast-add" ${CONFIG.fastAddEnabled ? 'checked' : ''}>
                    <label for="lm-fast-add">Enable Fast Add Mode (Skip Preview)</label>
                </div>
            </div>

            <div class="lm-anki-actions">
                <button id="lm-anki-test-connection" class="lm-anki-btn-submit" style="background-color: #007bff; margin-right: 10px;">Test Anki Connection</button>
                <button id="lm-anki-save-settings" class="lm-anki-btn-submit">Save Settings</button>
                <button id="lm-anki-cancel-settings" class="lm-anki-btn-cancel">Cancel</button>
            </div>
        `;

        modalContent.innerHTML = html;
        modal.appendChild(modalContent);

        // Add to page
        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('lm-anki-cancel-settings').addEventListener('click', function() {
            document.body.removeChild(modal);
        });

        document.getElementById('lm-anki-test-connection').addEventListener('click', async function() {
            try {
                // Get port from input
                const port = parseInt(document.getElementById('lm-anki-port').value);
                CONFIG.ankiConnectPort = port;

                // Test connection
                const version = await invokeAnkiConnect('version');
                showNotification(`Connected to AnkiConnect v${version}`, 'success');
            } catch (error) {
                showNotification('Failed to connect to Anki', 'error');
            }
        });

        document.getElementById('lm-anki-save-settings').addEventListener('click', function() {
            try {
                // Get values from form
                CONFIG.ankiConnectPort = parseInt(document.getElementById('lm-anki-port').value);
                CONFIG.defaultDeckName = document.getElementById('lm-anki-deck').value;
                CONFIG.allowDuplicates = document.getElementById('lm-allow-duplicates').checked;
                CONFIG.addTimestamp = document.getElementById('lm-add-timestamp').checked;
                CONFIG.fastAddEnabled = document.getElementById('lm-fast-add').checked;

                // Save to storage
                GM_setValue('ankiConnectPort', CONFIG.ankiConnectPort);
                GM_setValue('defaultDeckName', CONFIG.defaultDeckName);
                GM_setValue('allowDuplicates', CONFIG.allowDuplicates);
                GM_setValue('addTimestamp', CONFIG.addTimestamp);
                GM_setValue('fastAddEnabled', CONFIG.fastAddEnabled);

                showNotification('Settings saved', 'success');
                document.body.removeChild(modal);
            } catch (error) {
                log.error('Error saving settings:', error);
                showNotification('Error saving settings', 'error');
            }
        });
    }

    // Show modal with preview
    function showModal(content) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'lm-anki-modal';

        // Create content container
        const modalContent = document.createElement('div');
        modalContent.className = 'lm-anki-modal-content';

        // Add content with header (no X button)
        let html = `
            <div class="lm-anki-modal-header">
                <h2 class="lm-anki-modal-title">Preview Card</h2>
            </div>

            <div class="lm-anki-preview-content">
                <div class="lm-anki-card-side lm-anki-front">
                    <h3>Front</h3>
        `;

        // Front: Image
        if (content.images && content.images.length > 0) {
            html += `<img src="${content.images[0]}" class="lm-anki-preview-image" alt="Preview">`;
        } else {
            html += `<div>${content.title}</div>`;
        }

        html += `
                </div>

                <div class="lm-anki-card-side lm-anki-back">
                    <h3>Back</h3>
                    <div><b>${content.title.toUpperCase()}</b><br><br>${content.description}</div>
                </div>
            </div>
        `;

        // Duplicate handling info
        if (!CONFIG.allowDuplicates) {
            html += `
                <div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; margin-top: 10px;">
                    <strong>Note:</strong> Duplicate protection is enabled. If this card already exists, it won't be added.
                    Enable "Allow Duplicates" in settings to ensure all cards can be added.
                </div>
            `;
        }

        // Fast Add checkbox
        html += `
            <div class="lm-anki-checkbox-label">
                <input type="checkbox" class="lm-anki-checkbox" id="lm-fast-add-checkbox" ${CONFIG.fastAddEnabled ? 'checked' : ''}>
                <label for="lm-fast-add-checkbox">Enable Fast Add (Skip preview in the future)</label>
            </div>

            <div class="lm-anki-actions">
                <button id="lm-anki-cancel" class="lm-anki-btn-cancel">Cancel</button>
                <button id="lm-anki-submit" class="lm-anki-btn-submit">Add to Anki</button>
            </div>
        `;

        modalContent.innerHTML = html;
        modal.appendChild(modalContent);

        // Add to page
        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('lm-anki-cancel').addEventListener('click', function() {
            document.body.removeChild(modal);
        });

        document.getElementById('lm-anki-submit').addEventListener('click', async function() {
            try {
                // Show loading indicator
                this.textContent = 'Adding...';
                this.disabled = true;

                // Save Fast Add setting
                const fastAddEnabled = document.getElementById('lm-fast-add-checkbox').checked;
                CONFIG.fastAddEnabled = fastAddEnabled;
                GM_setValue('fastAddEnabled', fastAddEnabled);

                // Send to Anki
                await sendToAnki(content);

                // Close modal on success
                document.body.removeChild(modal);
            } catch (error) {
                // Reset button on error
                this.textContent = 'Add to Anki';
                this.disabled = false;
            }
        });
    }

    // Extract and process content
    async function processPage(showPreview = true) {
        try {
            log.info('Processing page...');
            const content = extractPageContent();

            if (!content.title || !content.description) {
                showNotification('Could not extract content from page', 'error');
                return;
            }

            if (showPreview) {
                showModal(content);
            } else {
                await sendToAnki(content);
            }
        } catch (error) {
            log.error('Error processing page:', error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // Function to create modernized buttons
    function addModernButtons() {
        // Create container for buttons
        const container = document.createElement('div');
        container.className = 'lm-anki-button-container';
        container.id = 'lm-anki-button-container';
        document.body.appendChild(container);

        // Create primary button (Create Anki Card)
        const createCardButton = document.createElement('button');
        createCardButton.className = 'lm-anki-button primary';
        createCardButton.innerHTML = '<span class="lm-anki-button-icon">📝</span>Create Anki Card';
        createCardButton.onclick = function() {
            processPage(true);
        };
        container.appendChild(createCardButton);

        // Create secondary button (Fast Add to Anki)
        const fastAddButton = document.createElement('button');
        fastAddButton.className = 'lm-anki-button secondary';
        fastAddButton.innerHTML = '<span class="lm-anki-button-icon">⚡</span>Fast Add to Anki';
        fastAddButton.onclick = function() {
            processPage(false);
        };
        container.appendChild(fastAddButton);

        // Create tertiary button (Anki Settings)
        const settingsButton = document.createElement('button');
        settingsButton.className = 'lm-anki-button tertiary';
        settingsButton.innerHTML = '<span class="lm-anki-button-icon">⚙️</span>Anki Settings';
        settingsButton.onclick = function() {
            showSettingsModal();
        };
        container.appendChild(settingsButton);

        // Setup responsive behavior for mobile
        setupMobileResponsiveness(container);

        log.info('Modern buttons added successfully');
    }

    // Function to handle mobile responsiveness
    function setupMobileResponsiveness(container) {
        const isMobile = () => window.innerWidth <= 768;
        let menuOpen = false;

        // Create mobile menu toggle button
        const menuButton = document.createElement('div');
        menuButton.className = 'lm-anki-menu-button';
        menuButton.innerHTML = '📋';
        menuButton.style.display = isMobile() ? 'flex' : 'none';
        document.body.appendChild(menuButton);

        // Function to update UI based on mobile state
        function updateMobileState() {
            if (isMobile()) {
                menuButton.style.display = 'flex';
                container.classList.add(menuOpen ? 'expanded' : 'collapsed');
            } else {
                menuButton.style.display = 'none';
                container.classList.remove('collapsed', 'expanded');
            }
        }

        // Toggle menu on click
        menuButton.onclick = function() {
            menuOpen = !menuOpen;
            container.classList.toggle('collapsed', !menuOpen);
            container.classList.toggle('expanded', menuOpen);
        };

        // Listen for window resize
        window.addEventListener('resize', debounce(function() {
            updateMobileState();
        }, 250));

        // Initial state setup
        updateMobileState();
    }

    // Simple debounce function to prevent excessive function calls
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Helper function to remove existing buttons
    function removeExistingButtons() {
        const existingContainer = document.getElementById('lm-anki-button-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        const existingMenu = document.querySelector('.lm-anki-menu-button');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Remove any old-style buttons that might be present
        const oldButtons = document.querySelectorAll('.lm-anki-btn, .lm-anki-btn-fast, .lm-anki-settings-btn');
        oldButtons.forEach(button => button.remove());
    }

    // Add buttons function (modernized version)
    function addButtons() {
        // Remove any existing buttons to prevent duplicates
        removeExistingButtons();

        // Add the modernized buttons
        addModernButtons();
    }

    // Initialize
    function init() {
        log.info('Initializing script');

        // Load stored settings
        CONFIG.ankiConnectPort = GM_getValue('ankiConnectPort', CONFIG.ankiConnectPort);
        CONFIG.defaultDeckName = GM_getValue('defaultDeckName', CONFIG.defaultDeckName);
        CONFIG.allowDuplicates = GM_getValue('allowDuplicates', CONFIG.allowDuplicates);
        CONFIG.addTimestamp = GM_getValue('addTimestamp', CONFIG.addTimestamp);
        CONFIG.fastAddEnabled = GM_getValue('fastAddEnabled', CONFIG.fastAddEnabled);

        if (document.body) {
            addButtons();
        } else {
            setTimeout(init, 100);
        }
    }

    // Start script
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();