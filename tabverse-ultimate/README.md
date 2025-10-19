# TabVerse Ultimate (v3)

**Advanced multitasking overlay workspace for Chrome**

TabVerse Ultimate transforms your browsing experience with floating, draggable windows, AI assistant, and persistent layouts that sync across devices.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## 🌟 Features

### 🪟 Floating Windows
- **Draggable & Resizable**: Move and resize windows freely on any webpage
- **Shadow DOM Isolation**: Styles don't interfere with the page's CSS
- **Persistent Layouts**: Positions and sizes saved per domain
- **Minimize/Maximize**: Full window management controls

### 🧭 Multi-View Split Layout
- **Horizontal & Vertical Splits**: Organize your workspace efficiently
- **Drag-and-Drop**: Rearrange tabs between windows and panes
- **Smooth Animations**: Polished, professional transitions

### 🤖 AI Assistant
- **Local Processing**: Basic page analysis without external API
- **OpenAI Integration**: Connect your API key for advanced responses (Premium)
- **Page Summarization**: Extract key points and headings automatically
- **Contextual Q&A**: Ask questions about the current page

### 📊 Built-in Widgets
- **Clock**: Real-time clock with timezone display
- **To-Do List**: Task management with persistence
- **Stats Counter**: Track your session activity

### ☁️ Cloud Sync
- **Cross-Device**: Settings and layouts sync via Chrome Sync
- **Domain Rules**: Automatically open specific widgets on certain sites
- **Theme Persistence**: Your customizations follow you everywhere

### 💎 Premium Features
- **Unlimited Windows**: No limit on floating windows (vs 3 on free)
- **Unlimited Panes**: Split your workspace as needed (vs 1 on free)
- **AI Assistant**: Full access to AI features with API support
- **Advanced Customization**: Theme colors, opacity, blur effects

## 🚀 Installation

### From Source (Developer Mode)

1. **Clone or download** this repository

2. **Open Chrome** and navigate to `chrome://extensions/`

3. **Enable Developer Mode** (toggle in top-right corner)

4. **Click "Load unpacked"** and select the `tabverse-ultimate` folder

5. **Grant permissions** when prompted

6. **Pin the extension** to your toolbar for easy access

### Icons Setup (Optional)

The extension includes a simple SVG icon. To create PNG icons:

```bash
cd tabverse-ultimate/icons
# Convert SVG to PNG at different sizes using your preferred tool
# Or use the included icon.svg as-is
```

## 📖 Usage

### Quick Start

1. **Activate Overlay**: Click the extension icon or press `Alt+T`

2. **Add a Window**: Click "Window" button in the control panel

3. **Add Widgets**: Click "Widgets" and select Clock, To-Do, or Stats

4. **Toggle AI**: Press `Alt+A` or click "AI" button

5. **Split Panes**: Use "Split H" or "Split V" for multi-pane layout

### Keyboard Shortcuts

- `Alt+T` - Toggle TabVerse overlay
- `Alt+A` - Toggle AI Assistant sidebar

### Settings

Access settings by:
- Right-clicking the extension icon → Options
- Clicking the gear icon in the extension popup
- Navigating to `chrome://extensions/` and clicking "Details" → "Extension options"

#### Configure:
- **License**: Enter your premium license key
- **AI Assistant**: Toggle features, add API key, choose response style
- **Theme**: Customize colors, opacity, and blur effects
- **Domain Rules**: Set which widgets auto-open on specific sites

## 🎨 Customization

### Theme Colors

In Settings, adjust:
- **Primary Color**: Main interface background
- **Accent Color**: Highlights and glowing borders
- **Opacity**: Window transparency (0.5 - 1.0)
- **Blur Strength**: Glassmorphism effect (0 - 20px)

### Domain-Specific Rules

Automatically open widgets on certain websites:

1. Go to Settings → Domain Rules
2. Enter domain (e.g., `github.com`)
3. Click "Add Domain Rule"

## 💰 Premium Subscription

### Free Tier
- ✓ 3 floating windows
- ✓ 1 pane layout
- ✓ Basic widgets
- ✓ Local storage

### Premium ($5/month)
- ✓ **Unlimited** floating windows
- ✓ **Unlimited** split panes
- ✓ AI assistant with API support
- ✓ Cross-device sync
- ✓ Advanced customization
- ✓ Domain-specific rules

### Upgrade

To test Premium features, use the demo license key:
```
TABVERSE-PREMIUM-DEMO
```

Enter this in Settings → License & Subscription → Verify License

## 🛠️ Development

### Project Structure

```
tabverse-ultimate/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js             # Injected into all pages
├── overlay.html           # Main overlay UI
├── overlay.js             # Overlay logic
├── ai.js                  # AI assistant module
├── license.js             # License management
├── popup.html             # Extension popup
├── settings.html          # Settings page
├── settings.js            # Settings logic
├── widgets/
│   ├── clock.js          # Clock widget
│   ├── todo.js           # To-Do widget
│   └── stats.js          # Stats widget
├── styles/
│   └── overlay.css       # Cyber-tech dark theme
└── icons/
    └── icon.svg          # Extension icon
```

### Technologies

- **Manifest V3**: Latest Chrome extension API
- **Vanilla JavaScript**: No external frameworks
- **Shadow DOM**: Style isolation from host page
- **Chrome Sync API**: Cross-device persistence
- **CSS Gradients & Backdrop Filters**: Cyber-tech aesthetic

### Extending

#### Add a New Widget

1. Create `widgets/mywidget.js`:

```javascript
class MyWidget {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `<div>My Widget Content</div>`;
  }
}

export default MyWidget;
```

2. Add to widgets menu in `overlay.html`:

```html
<div class="widget-menu-item" data-widget="mywidget">
  <span class="widget-icon">🎨</span>
  <span>My Widget</span>
</div>
```

3. Style in `styles/overlay.css` (optional)

## 🔒 Privacy & Security

- **Local-First**: All data stored locally or in Chrome Sync
- **No Tracking**: No analytics or user tracking
- **Shadow DOM**: Isolated from page JavaScript
- **API Keys**: Stored securely in Chrome Sync (encrypted)

## 🤝 Contributing

This is a standalone Chrome extension project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - feel free to use, modify, and distribute.

## 🐛 Troubleshooting

### Overlay not appearing?
- Press `Alt+T` to toggle
- Check that the extension is enabled
- Refresh the page

### AI not responding?
- Check Settings → AI Assistant is enabled
- For API mode, verify your OpenAI API key
- Try local mode (disable "Use OpenAI API")

### Sync not working?
- Verify you're signed into Chrome
- Premium tier required for cross-device sync
- Check internet connection

### Windows not saving position?
- Make sure to close windows (not just minimize)
- Layout saves automatically on window close
- Check Chrome Sync is enabled in browser settings

## 📧 Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check existing documentation
- Review Chrome extension developer docs

---

**Made with ❤️ for productive multitasking**

*TabVerse Ultimate - Transform your browser into a powerful workspace*
