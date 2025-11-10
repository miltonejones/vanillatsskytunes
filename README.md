# Skytunes 🎵

A modern, feature-rich music player web application built with TypeScript and vanilla JavaScript. Skytunes provides a seamless music listening experience with playlist management, audio controls, and an intuitive user interface.

## Features

### 🎧 Audio Player

- Full-featured audio player with play, pause, stop, next, and previous controls
- Progress bar with seek functionality
- Volume control
- Media session API integration for system-level controls
- Expanded player view for full-screen listening
- Mobile-optimized minimal player interface

### 📱 Responsive Design

- Desktop, tablet, and mobile layouts
- Touch-friendly controls
- Expandable player view
- Adaptive navigation

### 🎨 User Interface

- Dashboard with featured artists carousel
- Grid views for artists, albums, genres, and playlists
- Detailed views for albums, artists, genres, and playlists
- Search functionality with real-time results
- Toast notifications for user feedback
- Drawer-based playlist management

### 🎵 Music Management

- Browse music by artists, albums, genres, and playlists
- Queue management
- Add songs to custom playlists
- Library organization
- Track metadata display (title, artist, album, artwork)

### 🔊 Advanced Features

- Optional AI announcer for track changes
- Media session integration (lock screen controls)
- URL-based navigation with hash routing
- Persistent settings storage
- Custom playlist creation

## Architecture

### Core Components

#### Main Application (`main.ts`)

- Entry point and application orchestrator
- Event delegation for efficient DOM handling
- State management coordination

#### Controllers

**AudioPlayer (`audioPlayer.ts`)**

- Manages audio playback and controls
- Handles media session API
- Progress tracking and seeking
- Playlist drawer management
- Expandable player view

**CarouselController (`carouselController.ts`)**

- Dashboard carousel for featured artists
- Auto-rotation with manual controls
- Slide indicators and navigation

**URLController (`navigationController.ts`)**

- Hash-based routing
- URL state synchronization
- View navigation management

**SettingsController (`settingsController.ts`)**

- User preferences management
- AI announcer configuration
- Local storage integration

**BannerController (`bannerController.ts`)**

- Banner display management

**ToastController (`toastController.ts`)**

- User notifications
- Temporary alert messages

#### State Management

- Centralized store (`SkytunesStore`)
- Observer pattern for state updates
- Reactive UI rendering

## Technology Stack

- **TypeScript** - Type-safe development
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with custom properties
- **HTML5 Audio API** - Audio playback
- **Media Session API** - System integration
- **LocalStorage** - Settings persistence

## Project Structure

```
skytunes/
├── main.ts                 # Application entry point
├── controllers/
│   ├── audioPlayer.ts      # Audio playback management
│   ├── carouselController.ts # Dashboard carousel
│   ├── navigationController.ts # URL routing
│   ├── settingsController.ts # User settings
│   ├── bannerController.ts # Banner management
│   └── toastController.ts  # Notifications
├── store/                  # State management
├── views/                  # View templates
├── components/             # Reusable UI components
├── models/                 # TypeScript interfaces
├── styles/
│   ├── style.css          # Main styles
│   ├── drawer.css         # Drawer component
│   ├── audio-player.css   # Player styles
│   └── carousel.css       # Carousel styles
└── util/                  # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/miltonejones/vanillatsskytunes

# Navigate to project directory
cd vanillatsskytunes

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
```

## Usage

### Navigation

- Use the navigation bar to switch between views (Dashboard, Artists, Albums, Genres, Playlists)
- Click on items to view details
- Use browser back/forward buttons - navigation is URL-based

### Playing Music

1. Browse to any music collection
2. Click on a track to start playback
3. Use player controls at the bottom of the screen
4. Click the playlist button to view/manage the queue
5. On mobile, tap the minimized player to expand it

### Managing Playlists

- Click the menu button (•••) on any track
- Select "Add to Playlist"
- Choose an existing playlist or create a new one

### Settings

- Access settings from the navigation menu
- Configure AI announcer preferences
- Set your name and location for personalized announcements

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Key Features Implementation

### Event Delegation

The app uses efficient event delegation to handle clicks throughout the application:

```typescript
document.addEventListener("click", this.handleClick.bind(this), true);
```

### State Management

Centralized state with observer pattern:

```typescript
this.store.subscribe((state: IState) => {
  this.render(state);
});
```

### URL Routing

Hash-based routing with state synchronization:

```typescript
window.addEventListener("hashchange", () => this.handleURLChange());
```
