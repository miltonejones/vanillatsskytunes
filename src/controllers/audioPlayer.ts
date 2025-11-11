// Import component for rendering the song drawer/playlist
import { songDrawer } from "../components";

// Import utility functions for audio announcements
import {
  announceChange,
  pauseAnnouncement,
  resumeAnnouncement,
  stopAnnouncement,
} from "../util";

// Import controller for displaying toast notifications
import { ToastController } from "./toastController";

// Base URL for audio files stored in AWS CloudFront
export const CLOUD_FRONT_URL = "https://s3.amazonaws.com/box.import/";

// Helper function to construct properly formatted audio URLs
function playerUrl(FileKey: string): string {
  // Create audio URL by combining base URL with file key
  const audioURL = `${CLOUD_FRONT_URL}${FileKey}`
    .replace("#", "%23") // URL encode hash symbols
    .replace(/\+/g, "%2B"); // URL encode plus signs
  return audioURL;
}

// Main AudioPlayer class that handles all audio playback functionality
export class AudioPlayer {
  // HTML5 Audio element for actual playback
  private audioElement: HTMLAudioElement;
  // Reference to the application store for state management
  private store: any;
  // Function to unsubscribe from store changes
  private unsubscribe: (() => void) | null = null;
  // Flag indicating if audio is currently playing
  private isPlaying: boolean = false;
  // Interval ID for periodic UI updates
  private updateInterval: number | null = null;
  // ID of the currently loaded song
  private currentSongId: string | null = null;
  // Flag indicating if expanded view is active
  private isExpanded: boolean = false;
  // Controller for displaying toast notifications
  toastController;

  // Constructor initializes the audio player with store reference
  constructor(store: any) {
    this.store = store;
    // Create new HTML5 Audio element
    this.audioElement = new Audio();
    // Preload metadata for faster playback start
    this.audioElement.preload = "metadata";
    // Initialize toast controller for user notifications
    this.toastController = new ToastController();
    // Set up all event listeners
    this.setupEventListeners();
    // Set up audio-specific event handlers
    this.setupAudioEvents();
    // Set up media session API for OS integration
    this.setupMediaSession();

    // Subscribe to store changes and save unsubscribe function
    this.unsubscribe = this.store.subscribe(this.handleStoreChange.bind(this));
    // Start periodic UI updates
    this.startUIUpdates();

    // Log successful initialization
    console.log("AudioPlayer initialized successfully");
  }

  // Set up DOM event listeners for user interactions
  private setupEventListeners(): void {
    // Single event listener for all button clicks (event delegation)
    document.addEventListener("click", this.handleClick.bind(this), true);

    // Progress bar needs separate handling for input events
    const progressBar = document.getElementById(
      "progress-bar"
    ) as HTMLInputElement;
    const expandedProgressBar = document.getElementById(
      "expanded-progress-bar"
    ) as HTMLInputElement;

    // Add event listeners for regular progress bar
    if (progressBar) {
      progressBar.addEventListener(
        "input",
        this.handleProgressInput.bind(this)
      );
      progressBar.addEventListener(
        "change",
        this.handleProgressChange.bind(this)
      );
    }

    // Add event listeners for expanded view progress bar
    if (expandedProgressBar) {
      expandedProgressBar.addEventListener(
        "input",
        this.handleProgressInput.bind(this)
      );
      expandedProgressBar.addEventListener(
        "change",
        this.handleProgressChange.bind(this)
      );
    }
  }

  // Main click event handler using event delegation
  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    const button = target.closest("button") as HTMLButtonElement;

    // Handle song button clicks (toggle drawer)
    if (target.matches(".song-btn") || target.closest(".song-btn")) {
      event.preventDefault();
      this.toggleDrawer();
    }

    // If no button was clicked, check for mobile minimal info area
    if (!button) {
      // Handle clicks on mobile minimal info area to toggle expanded view
      if (target.closest(".mobile-minimal-info")) {
        this.toggleExpandedView();
      }
      return;
    }

    // Get button ID to determine which button was clicked
    const buttonId = button.id;

    // Handle different button types based on their ID
    switch (buttonId) {
      case "play-pause-btn":
      case "expanded-play-pause-btn":
        event.preventDefault();
        event.stopPropagation();
        this.togglePlayPause();
        break;

      case "prev-btn":
      case "expanded-prev-btn":
        event.preventDefault();
        event.stopPropagation();
        // Advance to previous track using store
        this.store.advanceTrack(-1);
        break;

      case "next-btn":
      case "expanded-next-btn":
        event.preventDefault();
        event.stopPropagation();
        // Advance to next track using store
        this.store.advanceTrack(1);
        break;

      case "stop-btn":
        event.preventDefault();
        event.stopPropagation();
        // Stop playback completely
        this.stop();
        break;

      case "playlist-btn":
      case "mobile-playlist-btn":
        event.preventDefault();
        event.stopPropagation();
        // Toggle playlist drawer
        this.toggleDrawer();
        break;

      case "mobile-play-btn":
        event.preventDefault();
        event.stopPropagation();
        // Toggle play/pause from mobile view
        this.togglePlayPause();
        break;

      case "close-expanded":
        event.preventDefault();
        event.stopPropagation();
        // Close expanded view
        this.toggleExpandedView();
        break;

      // Handle playlist item clicks (default case)
      default:
        this.handlePlaylistItemClick(target);
    }
  }

  // Handle clicks on individual playlist items
  private handlePlaylistItemClick(target: HTMLElement): void {
    // Check if click is on a playlist item or its children
    const playlistItem = target.closest(".playlist-item") as HTMLLIElement;
    if (playlistItem) {
      event?.preventDefault();
      event?.stopPropagation();

      // Calculate song index based on position in playlist
      const songIndex = Array.from(
        playlistItem.parentNode?.children || []
      ).indexOf(playlistItem);
      const songList = this.store.state.songList;

      // If valid index, play the selected song
      if (songIndex >= 0 && songIndex < songList.length) {
        const song = songList[songIndex];
        this.store.setSongList(songList, song);
        this.closeDrawer();
      }
    }
  }

  // Handle progress bar input events (while dragging)
  private handleProgressInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const progress = parseFloat(target.value);
    // Calculate time based on progress percentage
    const time = (progress / 100) * this.audioElement.duration;
    this.seekTo(time);
  }

  // Handle progress bar change events (after release)
  private handleProgressChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const progress = parseFloat(target.value);
    // Calculate time based on progress percentage
    const time = (progress / 100) * this.audioElement.duration;
    this.seekTo(time);
  }

  // Set up audio element event listeners
  private setupAudioEvents(): void {
    // When metadata (duration, etc.) is loaded
    this.audioElement.addEventListener("loadedmetadata", () => {
      this.updateDuration();
      this.updateProgress();
    });

    // When playback starts
    this.audioElement.addEventListener("play", () => {
      this.isPlaying = true;
      this.updateAllPlayPauseButtons();
      this.updateMediaSessionPlaybackState();
    });

    // When playback is paused
    this.audioElement.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updateAllPlayPauseButtons();
      this.updateMediaSessionPlaybackState();
    });

    // When song ends naturally
    this.audioElement.addEventListener("ended", () => {
      this.isPlaying = false;
      this.updateAllPlayPauseButtons();
      this.handleSongEnd();
    });

    // When audio error occurs
    this.audioElement.addEventListener("error", (e) => {
      console.error("Audio error:", e);
      this.isPlaying = false;
      this.updateAllPlayPauseButtons();
    });

    // When playback time updates (fired regularly during playback)
    this.audioElement.addEventListener("timeupdate", () => {
      this.updateProgress();
    });
  }

  // Start periodic UI updates for progress and time display
  private startUIUpdates(): void {
    this.updateInterval = window.setInterval(() => {
      this.updateProgress();
    }, 1000);
  }

  // Update progress bars and time displays
  private updateProgress(): void {
    const progressBar = document.getElementById(
      "progress-bar"
    ) as HTMLInputElement;
    const expandedProgressBar = document.getElementById(
      "expanded-progress-bar"
    ) as HTMLInputElement;
    const currentTimeEl = document.getElementById("current-time");
    const expandedCurrentTimeEl = document.getElementById(
      "expanded-current-time"
    );

    // Only update if we have valid duration
    if (this.audioElement.duration && isFinite(this.audioElement.duration)) {
      // Calculate progress percentage
      const progress =
        (this.audioElement.currentTime / this.audioElement.duration) * 100;

      // Update progress bars
      if (progressBar) {
        progressBar.value = progress.toString();
      }
      if (expandedProgressBar) {
        expandedProgressBar.value = progress.toString();
      }

      // Update time displays
      if (currentTimeEl) {
        currentTimeEl.textContent = this.formatTime(
          this.audioElement.currentTime
        );
      }
      if (expandedCurrentTimeEl) {
        expandedCurrentTimeEl.textContent = this.formatTime(
          this.audioElement.currentTime
        );
      }
    }
  }

  // Update duration displays
  private updateDuration(): void {
    const durationEl = document.getElementById("duration");
    const expandedDurationEl = document.getElementById("expanded-duration");
    const progressBar = document.getElementById(
      "progress-bar"
    ) as HTMLInputElement;
    const expandedProgressBar = document.getElementById(
      "expanded-progress-bar"
    ) as HTMLInputElement;

    // Only update if we have valid duration
    if (this.audioElement.duration && isFinite(this.audioElement.duration)) {
      // Update duration text displays
      if (durationEl) {
        durationEl.textContent = this.formatTime(this.audioElement.duration);
      }
      if (expandedDurationEl) {
        expandedDurationEl.textContent = this.formatTime(
          this.audioElement.duration
        );
      }
      // Set progress bar maximum values
      if (progressBar) {
        progressBar.max = "100";
      }
      if (expandedProgressBar) {
        expandedProgressBar.max = "100";
      }
    }
  }

  // Update all play/pause buttons to reflect current playback state
  private updateAllPlayPauseButtons(): void {
    // Update main player button
    const playPauseBtn = document.getElementById("play-pause-btn");
    if (playPauseBtn) {
      const icon = playPauseBtn.querySelector("i");
      if (icon) {
        // Switch between play and pause icons
        icon.className = this.isPlaying ? "fas fa-pause" : "fas fa-play";
      }
      playPauseBtn.title = this.isPlaying ? "Pause" : "Play";
    }

    // Update expanded view button
    const expandedPlayPauseBtn = document.getElementById(
      "expanded-play-pause-btn"
    );
    if (expandedPlayPauseBtn) {
      const icon = expandedPlayPauseBtn.querySelector("i");
      if (icon) {
        // Switch between play and pause icons
        icon.className = this.isPlaying ? "fas fa-pause" : "fas fa-play";
      }
      expandedPlayPauseBtn.title = this.isPlaying ? "Pause" : "Play";
    }

    // Update mobile minimal play button
    const mobilePlayBtn = document.getElementById("mobile-play-btn");
    if (mobilePlayBtn) {
      const icon = mobilePlayBtn.querySelector("i");
      if (icon) {
        // Switch between play and pause icons
        icon.className = this.isPlaying ? "fas fa-pause" : "fas fa-play";
      }
      mobilePlayBtn.title = this.isPlaying ? "Pause" : "Play";
    }
  }

  // Show or hide the audio player container
  private updatePlayerVisibility(visible: boolean): void {
    const container = document.querySelector(
      ".audio-player-container"
    ) as HTMLElement;
    if (container) {
      if (visible) {
        container.style.display = "block";
        container.classList.add("visible");
      } else {
        container.style.display = "none";
        container.classList.remove("visible");
        // Also close expanded view if player is hidden
        this.closeExpandedView();
      }
    }
  }

  // Update song information displays throughout the UI
  private updateSongInfo(song: any): void {
    // Update regular player elements
    const songTitleEl = document.getElementById("current-song-title");
    const songArtistEl = document.getElementById("current-song-artist");
    const songAlbumEl = document.getElementById("current-song-album");
    const songArtworkEl = document.getElementById(
      "current-song-artwork"
    ) as HTMLImageElement;

    // Update expanded view elements
    const expandedSongTitleEl = document.getElementById("expanded-song-title");
    const expandedSongArtistEl = document.getElementById(
      "expanded-song-artist"
    );
    const expandedAlbumArtEl = document.getElementById(
      "expanded-album-art"
    ) as HTMLImageElement;

    // Update mobile minimal view elements
    const mobileSongTitleEl = document.getElementById("mobile-song-title");
    const mobileSongArtistEl = document.getElementById("mobile-song-artist");
    const mobileSongArtworkEl = document.getElementById(
      "mobile-song-artwork"
    ) as HTMLImageElement;

    const playerContainer = document.querySelector(".audio-player");

    // If no song, clear all displays
    if (!song) {
      // Clear all text and image displays
      if (songTitleEl) songTitleEl.textContent = "No song selected";
      if (songArtistEl) songArtistEl.textContent = "Select a song to play";
      if (songAlbumEl) songAlbumEl.textContent = "";
      if (songArtworkEl) songArtworkEl.src = "";

      if (expandedSongTitleEl)
        expandedSongTitleEl.textContent = "No song selected";
      if (expandedSongArtistEl)
        expandedSongArtistEl.textContent = "Select a song to play";
      if (expandedAlbumArtEl) expandedAlbumArtEl.src = "";

      if (mobileSongTitleEl) mobileSongTitleEl.textContent = "No song selected";
      if (mobileSongArtistEl)
        mobileSongArtistEl.textContent = "Select a song to play";
      if (mobileSongArtworkEl) mobileSongArtworkEl.src = "";

      if (playerContainer) playerContainer.classList.remove("playing");

      // Hide player when no song is selected
      this.updatePlayerVisibility(false);
      return;
    }

    // Update all displays with song information
    if (songTitleEl) songTitleEl.textContent = song.Title || "Unknown Title";
    if (songArtistEl)
      songArtistEl.textContent = song.artistName || "Unknown Artist";
    if (songAlbumEl) songAlbumEl.textContent = song.albumName || "";
    if (songArtworkEl) songArtworkEl.src = song.albumImage || "";

    if (expandedSongTitleEl)
      expandedSongTitleEl.textContent = song.Title || "Unknown Title";
    if (expandedSongArtistEl)
      expandedSongArtistEl.textContent = song.artistName || "Unknown Artist";
    if (expandedAlbumArtEl) expandedAlbumArtEl.src = song.albumImage || "";

    if (mobileSongTitleEl)
      mobileSongTitleEl.textContent = song.Title || "Unknown Title";
    if (mobileSongArtistEl)
      mobileSongArtistEl.textContent = song.artistName || "Unknown Artist";
    if (mobileSongArtworkEl) mobileSongArtworkEl.src = song.albumImage || "";

    if (playerContainer) playerContainer.classList.add("playing");

    // Show player when song is selected
    this.updatePlayerVisibility(true);
  }

  // Update the playlist display
  private updatePlaylist(songList: any[], currentSongId: string): void {
    const playlistEl = document.getElementById("playlist");
    if (!playlistEl) return;

    // Use the songDrawer component to render the playlist
    playlistEl.innerHTML = songDrawer(this.store.state);
  }

  // Format time in seconds to MM:SS format
  private formatTime(seconds: number): string {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  // Handle store state changes (called when store state updates)
  private async handleStoreChange(state: any): Promise<void> {
    const previousSongId = this.currentSongId;
    this.currentSongId = state.currentSongId;

    // Check if song has changed
    const songChanged = previousSongId !== state.currentSongId;
    this.updatePlaylist(state.songList, state.currentSongId);

    // If song changed, update UI and load new song
    if (songChanged) {
      stopAnnouncement();
      this.updateSongInfo(state.currentSong);

      // Load and play new song if we have a valid song ID
      if (
        state.currentSongId &&
        state.currentSongId !== this.audioElement.src
      ) {
        await this.loadAndPlaySong(state);
      }

      // Update media session if available and we have a current song
      if (state.currentSong && this.shouldUpdateMediaSession(state)) {
        this.updateMediaSession(state.currentSong);
      }
    }
  }

  // Check if media session API is available and should be updated
  private shouldUpdateMediaSession(state: any): boolean {
    return state.currentSong && "mediaSession" in navigator;
  }

  // Load and play a new song
  private async loadAndPlaySong(state: any): Promise<void> {
    try {
      // Stop current playback
      this.audioElement.pause();
      this.isPlaying = false;
      this.updateAllPlayPauseButtons();

      // Construct and set new audio source
      const audioURL = playerUrl(state.currentSongId);
      this.audioElement.src = audioURL;

      // Wait for audio to load
      await new Promise((resolve, reject) => {
        const handleLoadedData = () => {
          this.audioElement.removeEventListener("error", handleError);
          resolve(true);
        };

        const handleError = () => {
          this.audioElement.removeEventListener("loadeddata", handleLoadedData);
          reject(new Error("Failed to load audio"));
        };

        this.audioElement.addEventListener("loadeddata", handleLoadedData, {
          once: true,
        });
        this.audioElement.addEventListener("error", handleError, {
          once: true,
        });
      });

      // Handle announcer if enabled
      if (state.announcerEnabled && state.currentSong) {
        await this.handleAnnouncer(state);
      }

      // Add playing class to main app container
      const app = document.getElementById("app");
      if (app) {
        app.classList.add("playing");
      }

      // Start playback
      await this.audioElement.play();
      // Show notification about current song
      this.toastController.alert(`Now playing "${state.currentSong.Title}"`);
      this.isPlaying = true;
      this.updateAllPlayPauseButtons();

      // Update media session information
      this.updateMediaSession(state.currentSong);
      this.updateMediaSessionPlaybackState();
    } catch (error) {
      console.error("Failed to load and play song:", error);
      this.isPlaying = false;
      this.updateAllPlayPauseButtons();
    }
  }

  // // Show loading spinner (used during announcer playback)
  // showSpinner() {
  //   document.querySelectorAll(".stop-btn").forEach((stopper) => {
  //     stopper.classList.add("hide");
  //   });
  //   document.querySelectorAll(".spinner-border").forEach((stopper) => {
  //     stopper.classList.remove("hide");
  //   });
  // }

  // // Hide loading spinner
  // hideSpinner() {
  //   document.querySelectorAll(".stop-btn").forEach((stopper) => {
  //     stopper.classList.remove("hide");
  //   });
  //   document.querySelectorAll(".spinner-border").forEach((stopper) => {
  //     stopper.classList.add("hide");
  //   });
  // }

  // Handle audio announcer (station ID, song introductions, etc.)
  private async handleAnnouncer(state: any): Promise<void> {
    try {
      // this.showSpinner();
      await announceChange(
        state.currentSong.artistName,
        state.currentSong.Title,
        state.currentSong.trackTime,
        state.chatType,
        state.chatName,
        state.chatZip,
        () => {
          // Callback when announcer starts - lower music volume
          // this.hideSpinner();
          this.audioElement.volume = 0.5;
        },
        () => {
          // Callback when announcer ends - restore music volume
          this.audioElement.volume = 1;
        }
      );
    } catch (error) {
      console.warn("Announcer failed:", error);
    }
  }

  // Set up media session API for OS integration (notification center, hardware controls)
  private setupMediaSession(): void {
    if (!("mediaSession" in navigator)) return;

    // Set up action handlers for media keys and notifications
    navigator.mediaSession.setActionHandler("play", () => {
      this.play();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      this.pause();
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      this.store.advanceTrack(-1);
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      this.store.advanceTrack(1);
    });

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        this.seekTo(details.seekTime);
      }
    });
  }

  // Update media session metadata (shown in OS media controls)
  private updateMediaSession(song: any): void {
    if (!("mediaSession" in navigator)) return;

    // Create media metadata for OS display
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.Title || "Unknown Title",
      artist: song.artistName || "Unknown Artist",
      album: song.albumName || "Unknown Album",
      artwork: song.albumImage
        ? [
            {
              src: song.albumImage,
              sizes: "512x512",
              type: "image/jpeg",
            },
          ]
        : [],
    });
  }

  // Update media session playback state (playing/paused)
  private updateMediaSessionPlaybackState(): void {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = this.isPlaying
        ? "playing"
        : "paused";
    }
  }

  // Handle when song ends naturally
  private handleSongEnd(): void {
    // Advance to next track
    this.store.advanceTrack(1);
  }

  // Drawer methods for playlist display

  // Toggle playlist drawer open/closed state
  private toggleDrawer(): void {
    this.store.setState({
      songListOpen: !this.store.state.songListOpen,
    });
  }

  // Close playlist drawer
  private closeDrawer(): void {
    this.store.setState({
      songListOpen: false,
    });
  }

  // Expanded view methods for full-screen player

  // Toggle expanded view (full-screen player)
  private toggleExpandedView(): void {
    const audioPlayer = document.querySelector(".audio-player");
    if (audioPlayer) {
      this.isExpanded = !this.isExpanded;
      audioPlayer.classList.toggle("expanded");

      // Prevent body scroll when expanded view is active
      document.body.style.overflow = this.isExpanded ? "hidden" : "";
    }
  }

  // Close expanded view
  private closeExpandedView(): void {
    const audioPlayer = document.querySelector(".audio-player");
    if (audioPlayer) {
      this.isExpanded = false;
      audioPlayer.classList.remove("expanded");
      // Restore body scroll
      document.body.style.overflow = "";
    }
    const app = document.getElementById("app");
    if (app) {
      app.classList.remove("playing");
    }
  }

  // Public methods for external control

  // Start or resume playback
  public play(): void {
    resumeAnnouncement();
    this.audioElement.play().catch((error) => {
      console.error("Play failed:", error);
    });
  }

  // Pause playback
  public pause(): void {
    pauseAnnouncement();
    this.audioElement.pause();
  }

  // Toggle between play and pause states
  public togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // Stop playback completely and reset
  public stop(): void {
    this.pause();
    this.audioElement.currentTime = 0;
    this.store.setSongList([], null);
    this.updatePlayerVisibility(false);
    this.closeExpandedView();
    stopAnnouncement();
  }

  // Seek to specific time in current track
  public seekTo(time: number): void {
    if (this.audioElement.duration) {
      this.audioElement.currentTime = Math.max(
        0,
        Math.min(time, this.audioElement.duration)
      );
    }
  }

  // Set playback volume (0.0 to 1.0)
  public setVolume(volume: number): void {
    this.audioElement.volume = Math.max(0, Math.min(1, volume));
  }

  // Clean up and destroy the audio player
  public destroy(): void {
    stopAnnouncement();
    this.audioElement.pause();

    // Clear UI update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Unsubscribe from store changes
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Remove event listeners
    document.removeEventListener("click", this.handleClick.bind(this), true);

    // Remove progress bar event listeners
    const progressBar = document.getElementById(
      "progress-bar"
    ) as HTMLInputElement;
    const expandedProgressBar = document.getElementById(
      "expanded-progress-bar"
    ) as HTMLInputElement;

    if (progressBar) {
      progressBar.removeEventListener(
        "input",
        this.handleProgressInput.bind(this)
      );
      progressBar.removeEventListener(
        "change",
        this.handleProgressChange.bind(this)
      );
    }

    if (expandedProgressBar) {
      expandedProgressBar.removeEventListener(
        "input",
        this.handleProgressInput.bind(this)
      );
      expandedProgressBar.removeEventListener(
        "change",
        this.handleProgressChange.bind(this)
      );
    }

    // Clear media session action handlers
    if ("mediaSession" in navigator) {
      const actions = [
        "play",
        "pause",
        "previoustrack",
        "nexttrack",
        "seekto",
      ] as const;
      actions.forEach((action) => {
        navigator.mediaSession.setActionHandler(action, null);
      });
    }

    // Remove audio element from DOM if it was added
    if (this.audioElement.parentNode) {
      this.audioElement.parentNode.removeChild(this.audioElement);
    }
  }

  // Getters for current state information

  // Get current playback time in seconds
  public getCurrentTime(): number {
    return this.audioElement.currentTime;
  }

  // Get total duration of current track in seconds
  public getDuration(): number {
    return this.audioElement.duration;
  }

  // Check if audio is currently playing
  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Check if expanded view is active
  public getIsExpanded(): boolean {
    return this.isExpanded;
  }

  // Manually show or hide the player
  public setVisible(visible: boolean): void {
    this.updatePlayerVisibility(visible);
  }
}
