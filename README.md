# LearnableMeta to Anki Integration

A Tampermonkey script that seamlessly extracts content from LearnableMeta.com and creates Anki flashcards with a single click. Perfect for GeoGuessr players who want to study location indicators and visual clues.

## Features

- **Simple Interface**: Modern, intuitive buttons that integrate with the LearnableMeta website
- **Smart Content Extraction**: Automatically extracts titles, descriptions, and images
- **Image-First Flashcards**: Creates cards with images on the front and descriptions on the back
- **Preview Before Creating**: Review card content before adding to Anki
- **Fast Add Option**: Quickly add cards without preview
- **Duplicate Handling**: Multiple options to manage duplicate cards
- **Fully Customizable**: Configure Anki deck, note type, and more
- **Mobile Responsive**: Works on all screen sizes with a collapsible mobile interface

## Installation

### Prerequisites

1. **Anki**
   - Download and install [Anki](https://apps.ankiweb.net/) if you haven't already
   - Create or use an existing Anki profile

2. **AnkiConnect**
   - Open Anki
   - Go to Tools → Add-ons → Get Add-ons...
   - Paste the AnkiConnect code: `2055492159`
   - Click "OK" and restart Anki
   - Make sure Anki is running whenever you want to create cards

3. **Tampermonkey**
   - Install the [Tampermonkey](https://www.tampermonkey.net/) extension for your browser:
     - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
     - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
     - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
     - [Safari](https://apps.apple.com/app/tampermonkey/id1482490089)

### Script Installation

1. Click on the Tampermonkey icon in your browser and select "Create a new script"
2. Delete any existing code
3. Copy and paste the entire script from [learnablemeta-to-anki.js](learnablemeta-to-anki.js)
4. Save the script (Ctrl+S or File → Save)

### Anki Setup

1. Open Anki and select a profile
2. If you don't have a "Basic" note type:
   - Click "Tools" → "Manage Note Types"
   - Click "Add" and select "Basic"
   - Click "OK"
3. Create a new deck for LearnableMeta cards (optional):
   - Click "Create Deck" at the bottom of the screen
   - Name it "LearnableMeta" (or whatever you prefer)
   - Click "Save"

## Usage

1. Visit [LearnableMeta.com](https://learnablemeta.com)
2. Navigate to any content page
3. Use one of the buttons that appear on the page:
   - **Create Anki Card**: Shows a preview with the extracted content
   - **Fast Add to Anki**: Immediately creates a card without preview
   - **Anki Settings**: Configure the script settings

### Card Format

The created cards will have:
- **Front**: The extracted image
- **Back**: The title in bold followed by the description text

Example:
```
Front: [Image]
Back: **Albania - Rifts **
If you look up and see a "rift" in the sky, this glitch is most commonly found in Albania or Montenegro within Europe. Most of the time, you will see it, but if you don't, don't rule out these countries.
```

## Configuration

Click the "Anki Settings" button to customize:

- **Anki Connection**: Port and deck name
- **Duplicate Handling**: Allow duplicates or add timestamps
- **Fast Add Mode**: Enable/disable preview skip

## Troubleshooting

### "Failed to connect to Anki"
- Make sure Anki is running
- Check that AnkiConnect is installed properly
- Verify the port in settings (default: 8765)

### "Card already exists"
- Enable "Allow Duplicate Cards" in settings
- Or enable "Add Timestamp to Card"

### Content extraction issues
- If images or text are missing, try reloading the page
- Some LearnableMeta pages may have different formats

### Button doesn't appear
- Make sure you're on a LearnableMeta content page
- Try refreshing the page
- Check if Tampermonkey is enabled

## License

This script is released under the MIT License.

## Acknowledgments

- [AnkiConnect](https://github.com/FooSoft/anki-connect)
- [LearnableMeta](https://learnablemeta.com) for providing valuable GeoGuessr learning resources

---

