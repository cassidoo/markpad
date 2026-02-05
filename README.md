# Markpad (Work in Progress)

A minimal markdown editor with live preview and GitHub Gist publishing.

You can find our development on [GitHub's YouTube](https://www.youtube.com/@GitHub/streams) weekly!

## Features

- **Live Markdown Preview**: Edit markdown with real-time styled preview
- **File Management**: Open, save, and manage markdown files
- **GitHub Gist Publishing**: One-click publish to GitHub Gists
- **Smart Authentication**: Automatically uses existing GitHub CLI or Copilot credentials, falls back to device flow
- **Auto-naming**: Unsaved files are named from the first heading in dash-case

## Installation & Usage

### Development
```bash
npm install
npm start
```

### Build
```bash
npm run make
```

The built executable will be in the `out/` directory.

## Authentication

Markpad tries authentication in this order:
1. GitHub CLI (`gh`) if logged in
2. GitHub Copilot CLI if authenticated
3. GitHub OAuth device flow (prompts for code)

## Keyboard Shortcuts

- `Ctrl/Cmd+N` - New file
- `Ctrl/Cmd+O` - Open file
- `Ctrl/Cmd+S` - Save file
- `Ctrl/Cmd+Shift+S` - Save as
- `Ctrl/Cmd+G` - Publish to Gist

## License

ISC
