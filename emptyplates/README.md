# Empty Plates

A minimal, interactive photo gallery documenting empty plates after memorable dinners.

## About

This project captures the beauty of empty plates - a testament to good meals and great company. Each photograph tells the story of a dinner through what remains.

## Features

- **Draggable Canvas** - Pan around to explore all the plates
- **Individual Photo Drag** - Click and drag any plate to rearrange
- **Date & Location Captions** - Each plate shows when and where it was photographed
- **Minimal Design** - Clean, focused on the photographs
- **Responsive** - Works on desktop and mobile

## Getting Started

1. Add your empty plate photos to the `images/` folder
2. Update the photo data in `script.js` with:
   - Image filenames
   - Dimensions (plates are typically square: 280x280)
   - Month/date of the dinner
   - Location where you dined

3. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```

4. Open http://localhost:8000 in your browser

## Customization

### Adding Photos

Edit the `photos` array in `script.js`:

```javascript
const photos = [
    { url: 'images/plate1.jpg', width: 280, height: 280, month: 'January', location: 'Home' },
    // Add more plates...
];
```

### Styling

Colors and fonts can be adjusted in `style.css`:

```css
:root {
    --bg-color: #f5f5f0;
    --text-color: #1a1a1a;
}
```

## Photography Tips

- Shoot from directly above the plate
- Use natural or soft lighting
- Square format works best (1:1 ratio)
- Include the whole plate in frame
- Capture the character of what's left behind

## Concept

Empty plates are often overlooked, yet they hold stories - the satisfaction of a good meal, the conversation shared, the memories made. This project is a simple archive of those moments.

Enjoy your dinners!
