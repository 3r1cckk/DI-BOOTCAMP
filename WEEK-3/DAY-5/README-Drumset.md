# 🥁 Drumset Mini-Project

A complete interactive drumset game built with HTML, CSS, and JavaScript. Click on drum pads or use keyboard keys to play different drum sounds.

## Project Structure

```
Mini-project-drumset/
├── Mini-project-drumset.html    # Main HTML file
├── Mini-project-drumset.js      # JavaScript logic
├── style.css                    # Styling
├── sounds/                      # Audio files folder (create this)
│   ├── kick.wav
│   ├── snare.wav
│   ├── hihat-closed.wav
│   ├── hihat-open.wav
│   ├── tom-high.wav
│   ├── tom-mid.wav
│   ├── tom-low.wav
│   ├── crash.wav
│   └── clap.wav
└── README.md                    # This file
```

## Features

✅ **9 Different Drum Sounds** - Kick, Snare, Hi-Hat (open/closed), Toms (high/mid/low), Cymbal, Clap  
✅ **Keyboard Support** - Press A-L keys to play drums  
✅ **Mouse Click Support** - Click on drum pads  
✅ **Visual Feedback** - Buttons animate on click/keypress  
✅ **Responsive Design** - Works on mobile and desktop  
✅ **Audio Playback** - Allows rapid-fire drum hits  

## How to Use

### 1. Setup Audio Files

Create a `sounds/` folder in the same directory as the HTML file and add these audio files:
- `kick.wav` - Bass drum sound
- `snare.wav` - Snare drum sound
- `hihat-closed.wav` - Closed hi-hat
- `hihat-open.wav` - Open hi-hat
- `tom-high.wav` - High tom
- `tom-mid.wav` - Mid tom
- `tom-low.wav` - Low tom
- `crash.wav` - Cymbal crash
- `clap.wav` - Clap sound

**Get these from:** https://github.com/devtlv/drumset_setup

### 2. Open in Browser

Simply open `Mini-project-drumset.html` in any modern web browser.

### 3. Play!

**Using Keyboard:**
- Press keys **A, S, D, F, G, H, J, K, L** to play different drums
- Each key maps to a different drum sound

**Using Mouse:**
- Click on any drum pad to play that sound

## Keyboard Mapping

| Key | Drum |
|-----|------|
| A | Kick |
| S | Snare |
| D | Hi-Hat Closed |
| F | Tom High |
| G | Tom Mid |
| H | Tom Low |
| J | Cymbal Crash |
| K | Hi-Hat Open |
| L | Clap |

## File Descriptions

### Mini-project-drumset.html
- Main HTML structure
- Contains audio elements for each drum
- Links to external CSS and JavaScript files

### Mini-project-drumset.js
- **playDrum(key)** - Plays audio and provides visual feedback
- **initializeDrumButtons()** - Creates drum buttons dynamically
- **Keyboard event handlers** - Listens for A-L key presses
- **Visual feedback** - Adds/removes 'active' class for animations

### style.css
- Beautiful gradient backgrounds for each drum type
- Responsive grid layout (3 columns on desktop, 2 on mobile)
- Hover and active states
- Smooth animations and transitions
- Mobile-friendly media queries

## Technologies Used

- **HTML5** - Audio element for sound playback
- **CSS3** - Gradients, animations, flexbox, grid
- **Vanilla JavaScript** - DOM manipulation, event listeners

## DOM Concepts Used

✓ **DOM Events**
- `keydown` - Keyboard key press detection
- `keyup` - Keyboard key release
- `click` - Mouse click detection

✓ **DOM Tree Traversal**
- `document.getElementById()` - Get audio elements
- `document.querySelector()` - Get drum buttons
- `element.classList` - Add/remove CSS classes

✓ **HTML Audio API**
- `audio.play()` - Play sound
- `audio.currentTime` - Reset audio position

## Learning Outcomes

After completing this project, you will understand:
- How to create interactive elements with event listeners
- How to work with the HTML Audio API
- DOM tree structure and traversal
- CSS Grid for layout
- Keyboard and mouse event handling
- Visual feedback and animations

## Browser Support

Works on all modern browsers:
- Chrome/Chromium
- Firefox
- Safari
- Edge

## Tips & Tricks

1. **Rapid Fire** - Click/press multiple keys quickly to play drum patterns
2. **Record Yourself** - Try recording your drumset performance using browser dev tools
3. **Sound Quality** - Use high-quality drum samples for better results
4. **Customize** - Edit `style.css` to change colors, sizes, and animations

## Troubleshooting

**Audio not playing?**
- Make sure `sounds/` folder exists in the same directory
- Check that audio file names match exactly in the JavaScript
- Try refreshing the page (Ctrl+R or Cmd+R)

**Buttons not appearing?**
- Check browser console (F12) for JavaScript errors
- Make sure `Mini-project-drumset.js` is in the same directory
- Verify `style.css` is linked correctly

**Keyboard not working?**
- Make sure you're not in an input field
- Check that A-L keys haven't been remapped by browser extensions
- Try clicking on the page first to ensure it has focus

## Author

Created as part of the DI-BOOTCAMP WEEK-3 mini-project series.

## License

Feel free to modify and use for learning purposes!

---

**Happy Drumming! 🎶**
