import { songDrawer } from "../components";
import {
  announceChange,
  pauseAnnouncement,
  resumeAnnouncement,
  stopAnnouncement,
} from "../util";
import { ToastController } from "./toastController";

export const CLOUD_FRONT_URL = "https://s3.amazonaws.com/box.import/";

function playerUrl(FileKey: string): string {
  const audioURL = `${CLOUD_FRONT_URL}${FileKey}`
    .replace("#", "%23")
    .replace(/\+/g, "%2B");
  return audioURL;
}

export class AudioPlayer {
  private audioElement: HTMLAudioElement;
  private store: any;
  private unsubscribe: (() => void) | null = null;
  private isPlaying: boolean = false;
  private updateInterval: number | null = null;
  private currentSongId: string | null = null;
  private isExpanded: boolean = false;
  toastController;
  constructor(store: any) {
    this.store = store;
    this.audioElement = new Audio();
    this.audioElement.preload = "metadata";
    this.toastController = new ToastController();
    this.setupEventListeners();
    this.setupAudioEvents();
    this.setupMediaSession();

    this.unsubscribe = this.store.subscribe(this.handleStoreChange.bind(this));
    this.startUIUpdates();

    console.log("AudioPlayer initialized successfully");
  }

  private setupEventListeners(): void {
    // Single event listener for all button clicks
    document.addEventListener("click", this.handleClick.bind(this), true);

    // Progress bar needs separate handling
    const progressBar = document.getElementById(
      "progress-bar"
    ) as HTMLInputElement;
    const expandedProgressBar = document.getElementById(
      "expanded-progress-bar"
    ) as HTMLInputElement;

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

    // Overlay click to close drawer
    // const overlay = document.getElementById("drawer-overlay");
    // if (overlay) {
    //   overlay.addEventListener("click", this.closeDrawer.bind(this));
    // }
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    const button = target.closest("button") as HTMLButtonElement;

    if (target.matches(".song-btn") || target.closest(".song-btn")) {
      event.preventDefault();
      this.toggleDrawer();
    }

    if (!button) {
      // Handle clicks on mobile minimal info area
      if (target.closest(".mobile-minimal-info")) {
        this.toggleExpandedView();
      }
      return;
    }

    const buttonId = button.id;
    console.log(`Button clicked: ${buttonId}`);

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
        this.store.advanceTrack(-1);
        break;

      case "next-btn":
      case "expanded-next-btn":
        event.preventDefault();
        event.stopPropagation();
        this.store.advanceTrack(1);
        break;

      case "stop-btn":
        event.preventDefault();
        event.stopPropagation();
        this.stop();
        break;

      case "playlist-btn":
      case "mobile-playlist-btn":
        event.preventDefault();
        event.stopPropagation();
        this.toggleDrawer();
        break;

      // case "close-drawer":
      //   event.preventDefault();
      //   event.stopPropagation();
      //   this.closeDrawer();
      //   break;

      case "mobile-play-btn":
        event.preventDefault();
        event.stopPropagation();
        this.togglePlayPause();
        break;

      case "close-expanded":
        event.preventDefault();
        event.stopPropagation();
        this.toggleExpandedView();
        break;

      // Handle playlist item clicks
      default:
        this.handlePlaylistItemClick(target);
    }
  }

  private handlePlaylistItemClick(target: HTMLElement): void {
    // Check if click is on a playlist item or its children
    const playlistItem = target.closest(".playlist-item") as HTMLLIElement;
    if (playlistItem) {
      event?.preventDefault();
      event?.stopPropagation();

      const songIndex = Array.from(
        playlistItem.parentNode?.children || []
      ).indexOf(playlistItem);
      const songList = this.store.state.songList;

      if (songIndex >= 0 && songIndex < songList.length) {
        const song = songList[songIndex];
        this.store.setSongList(songList, song);
        this.closeDrawer();
      }
    }
  }

  private handleProgressInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const progress = parseFloat(target.value);
    const time = (progress / 100) * this.audioElement.duration;
    this.seekTo(time);
  }

  private handleProgressChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const progress = parseFloat(target.value);
    const time = (progress / 100) * this.audioElement.duration;
    this.seekTo(time);
  }

  private setupAudioEvents(): void {
    this.audioElement.addEventListener("loadedmetadata", () => {
      this.updateDuration();
      this.updateProgress();
    });

    this.audioElement.addEventListener("play", () => {
      this.isPlaying = true;
      this.updateAllPlayPauseButtons();
      this.updateMediaSessionPlaybackState();
    });

    this.audioElement.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updateAllPlayPauseButtons();
      this.updateMediaSessionPlaybackState();
    });

    this.audioElement.addEventListener("ended", () => {
      this.isPlaying = false;
      this.updateAllPlayPauseButtons();
      this.handleSongEnd();
    });

    this.audioElement.addEventListener("error", (e) => {
      console.error("Audio error:", e);
      this.isPlaying = false;
      this.updateAllPlayPauseButtons();
    });

    this.audioElement.addEventListener("timeupdate", () => {
      this.updateProgress();
    });
  }

  private startUIUpdates(): void {
    this.updateInterval = window.setInterval(() => {
      this.updateProgress();
    }, 1000);
  }

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

    if (this.audioElement.duration && isFinite(this.audioElement.duration)) {
      const progress =
        (this.audioElement.currentTime / this.audioElement.duration) * 100;

      if (progressBar) {
        progressBar.value = progress.toString();
      }
      if (expandedProgressBar) {
        expandedProgressBar.value = progress.toString();
      }

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

  private updateDuration(): void {
    const durationEl = document.getElementById("duration");
    const expandedDurationEl = document.getElementById("expanded-duration");
    const progressBar = document.getElementById(
      "progress-bar"
    ) as HTMLInputElement;
    const expandedProgressBar = document.getElementById(
      "expanded-progress-bar"
    ) as HTMLInputElement;

    if (this.audioElement.duration && isFinite(this.audioElement.duration)) {
      if (durationEl) {
        durationEl.textContent = this.formatTime(this.audioElement.duration);
      }
      if (expandedDurationEl) {
        expandedDurationEl.textContent = this.formatTime(
          this.audioElement.duration
        );
      }
      if (progressBar) {
        progressBar.max = "100";
      }
      if (expandedProgressBar) {
        expandedProgressBar.max = "100";
      }
    }
  }

  private updateAllPlayPauseButtons(): void {
    // Update main player button
    const playPauseBtn = document.getElementById("play-pause-btn");
    if (playPauseBtn) {
      const icon = playPauseBtn.querySelector("i");
      if (icon) {
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
        icon.className = this.isPlaying ? "fas fa-pause" : "fas fa-play";
      }
      expandedPlayPauseBtn.title = this.isPlaying ? "Pause" : "Play";
    }

    // Update mobile minimal play button
    const mobilePlayBtn = document.getElementById("mobile-play-btn");
    if (mobilePlayBtn) {
      const icon = mobilePlayBtn.querySelector("i");
      if (icon) {
        icon.className = this.isPlaying ? "fas fa-pause" : "fas fa-play";
      }
      mobilePlayBtn.title = this.isPlaying ? "Pause" : "Play";
    }
  }

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

  private updateSongInfo(song: any): void {
    // Update regular player
    const songTitleEl = document.getElementById("current-song-title");
    const songArtistEl = document.getElementById("current-song-artist");
    const songAlbumEl = document.getElementById("current-song-album");
    const songArtworkEl = document.getElementById(
      "current-song-artwork"
    ) as HTMLImageElement;

    // Update expanded view
    const expandedSongTitleEl = document.getElementById("expanded-song-title");
    const expandedSongArtistEl = document.getElementById(
      "expanded-song-artist"
    );
    const expandedAlbumArtEl = document.getElementById(
      "expanded-album-art"
    ) as HTMLImageElement;

    // Update mobile minimal view
    const mobileSongTitleEl = document.getElementById("mobile-song-title");
    const mobileSongArtistEl = document.getElementById("mobile-song-artist");
    const mobileSongArtworkEl = document.getElementById(
      "mobile-song-artwork"
    ) as HTMLImageElement;

    const playerContainer = document.querySelector(".audio-player");

    if (!song) {
      // Clear all displays
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

      this.updatePlayerVisibility(false);
      return;
    }

    // Update all displays with song info
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

    this.updatePlayerVisibility(true);
  }

  private updatePlaylist(songList: any[], currentSongId: string): void {
    const playlistEl = document.getElementById("playlist");
    if (!playlistEl) return;

    playlistEl.innerHTML = songDrawer(this.store.state);

    // songList.forEach((song, index) => {
    //   const li = document.createElement("li");
    //   li.className = `playlist-item ${
    //     song.FileKey === currentSongId ? "active" : ""
    //   } ${song.queued ? "queued" : ""}`;
    //   li.dataset.songIndex = index.toString();
    //   li.dataset.trackId = song.ID;

    //   const img = document.createElement("img");
    //   img.src = song.albumImage || "";
    //   img.alt = song.Title || "";
    //   img.className = `playlist-img ${
    //     song.FileKey === currentSongId ? "playing-animation" : ""
    //   }`;

    //   const content = document.createElement("div");
    //   content.className = "playlist-content";

    //   const title = document.createElement("div");
    //   title.className = "playlist-title";
    //   title.textContent = song.Title || "Unknown Title";

    //   const artist = document.createElement("div");
    //   artist.className = "playlist-artist";
    //   artist.textContent = song.artistName || "Unknown Artist";

    //   content.appendChild(title);
    //   content.appendChild(artist);

    //   li.appendChild(img);
    //   li.appendChild(content);

    //   playlistEl.appendChild(li);
    // });
  }

  private formatTime(seconds: number): string {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  private async handleStoreChange(state: any): Promise<void> {
    const previousSongId = this.currentSongId;
    this.currentSongId = state.currentSongId;

    const songChanged = previousSongId !== state.currentSongId;
    this.updatePlaylist(state.songList, state.currentSongId);

    if (songChanged) {
      stopAnnouncement();
      this.updateSongInfo(state.currentSong);

      if (
        state.currentSongId &&
        state.currentSongId !== this.audioElement.src
      ) {
        await this.loadAndPlaySong(state);
      }

      if (state.currentSong && this.shouldUpdateMediaSession(state)) {
        this.updateMediaSession(state.currentSong);
      }
    }
  }

  private shouldUpdateMediaSession(state: any): boolean {
    return state.currentSong && "mediaSession" in navigator;
  }

  private async loadAndPlaySong(state: any): Promise<void> {
    try {
      this.audioElement.pause();
      this.isPlaying = false;
      this.updateAllPlayPauseButtons();

      const audioURL = playerUrl(state.currentSongId);
      this.audioElement.src = audioURL;

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

      if (state.announcerEnabled && state.currentSong) {
        await this.handleAnnouncer(state);
      }

      const app = document.getElementById("app");
      if (app) {
        app.classList.add("playing");
      }

      await this.audioElement.play();
      this.toastController.alert(`Now playing "${state.currentSong.Title}"`);
      this.isPlaying = true;
      this.updateAllPlayPauseButtons();

      this.updateMediaSession(state.currentSong);
      this.updateMediaSessionPlaybackState();
    } catch (error) {
      console.error("Failed to load and play song:", error);
      this.isPlaying = false;
      this.updateAllPlayPauseButtons();
    }
  }

  showSpinner() {
    document.querySelectorAll(".stop-btn").forEach((stopper) => {
      stopper.classList.add("hide");
    });
    document.querySelectorAll(".spinner-border").forEach((stopper) => {
      stopper.classList.remove("hide");
    });
  }

  hideSpinner() {
    document.querySelectorAll(".stop-btn").forEach((stopper) => {
      stopper.classList.remove("hide");
    });
    document.querySelectorAll(".spinner-border").forEach((stopper) => {
      stopper.classList.add("hide");
    });
  }

  private async handleAnnouncer(state: any): Promise<void> {
    try {
      this.showSpinner();
      await announceChange(
        state.currentSong.artistName,
        state.currentSong.Title,
        state.currentSong.trackTime,
        state.chatType,
        state.chatName,
        state.chatZip,
        () => {
          this.hideSpinner();
          this.audioElement.volume = 0.5;
        },
        () => {
          this.audioElement.volume = 1;
        }
      );
    } catch (error) {
      console.warn("Announcer failed:", error);
    }
  }

  private setupMediaSession(): void {
    if (!("mediaSession" in navigator)) return;

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

  private updateMediaSession(song: any): void {
    if (!("mediaSession" in navigator)) return;

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

  private updateMediaSessionPlaybackState(): void {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = this.isPlaying
        ? "playing"
        : "paused";
    }
  }

  private handleSongEnd(): void {
    this.store.advanceTrack(1);
  }

  // Drawer methods
  private toggleDrawer(): void {
    this.store.setState({
      songListOpen: !this.store.state.songListOpen,
    });
    // const drawer = document.getElementById("playlist-drawer");
    // const overlay = document.getElementById("drawer-overlay");

    // if (drawer) drawer.classList.toggle("open");
    // if (overlay) overlay.classList.toggle("active");
  }

  private closeDrawer(): void {
    this.store.setState({
      songListOpen: false,
    });
    // const drawer = document.getElementById("playlist-drawer");
    // const overlay = document.getElementById("drawer-overlay");

    // if (drawer) drawer.classList.remove("open");
    // if (overlay) overlay.classList.remove("active");
  }

  // Expanded view methods
  private toggleExpandedView(): void {
    const audioPlayer = document.querySelector(".audio-player");
    if (audioPlayer) {
      this.isExpanded = !this.isExpanded;
      audioPlayer.classList.toggle("expanded");

      // Prevent body scroll when expanded
      document.body.style.overflow = this.isExpanded ? "hidden" : "";
    }
  }

  private closeExpandedView(): void {
    const audioPlayer = document.querySelector(".audio-player");
    if (audioPlayer) {
      this.isExpanded = false;
      audioPlayer.classList.remove("expanded");
      document.body.style.overflow = "";
    }
    const app = document.getElementById("app");
    if (app) {
      app.classList.remove("playing");
    }
  }

  // Public methods
  public play(): void {
    resumeAnnouncement();
    this.audioElement.play().catch((error) => {
      console.error("Play failed:", error);
    });
  }

  public pause(): void {
    pauseAnnouncement();
    this.audioElement.pause();
  }

  public togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public stop(): void {
    this.pause();
    this.audioElement.currentTime = 0;
    this.store.setSongList([], null);
    this.updatePlayerVisibility(false);
    this.closeExpandedView();
    stopAnnouncement();
  }

  public seekTo(time: number): void {
    if (this.audioElement.duration) {
      this.audioElement.currentTime = Math.max(
        0,
        Math.min(time, this.audioElement.duration)
      );
    }
  }

  public setVolume(volume: number): void {
    this.audioElement.volume = Math.max(0, Math.min(1, volume));
  }

  public destroy(): void {
    stopAnnouncement();
    this.audioElement.pause();

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    document.removeEventListener("click", this.handleClick.bind(this), true);

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

    // const overlay = document.getElementById("drawer-overlay");
    // if (overlay) {
    //   overlay.removeEventListener("click", this.closeDrawer.bind(this));
    // }

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

    if (this.audioElement.parentNode) {
      this.audioElement.parentNode.removeChild(this.audioElement);
    }
  }

  // Getters
  public getCurrentTime(): number {
    return this.audioElement.currentTime;
  }

  public getDuration(): number {
    return this.audioElement.duration;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsExpanded(): boolean {
    return this.isExpanded;
  }

  public setVisible(visible: boolean): void {
    this.updatePlayerVisibility(visible);
  }
}

// // Extend Window interface
// declare global {
//   interface Window {
//     audioPlayer: AudioPlayer;
//   }
// }

// window.audioPlayer = new AudioPlayer();
