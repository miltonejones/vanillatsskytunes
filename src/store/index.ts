// store.ts
import { artistBanner } from "../components";
import {
  getAlbumDetail,
  getAlbumGrid,
  getArtistDetail,
  getArtistGrid,
  getDashboard,
  getGenreDetail,
  getGenreGrid,
  getLibrary,
  getPlaylistDetail,
  getPlaylistGrid,
  getSearch,
  savePlaylist,
} from "../connector";
import { ToastController } from "../controllers/toastController";
import type {
  BannerProps,
  DashItem,
  IPlaylistItem,
  IState,
  ITrackItem,
  Listener,
} from "../models";

/**
 * SkytunesStore is the central state management system for the application
 * It implements the Observer pattern, managing all application state and notifying
 * subscribed components when state changes occur.
 *
 * Core responsibilities:
 * - Managing application state (current view, loaded data, playback state, etc.)
 * - Loading data from the backend API via connector functions
 * - Notifying subscribers (controllers, views) when state changes
 * - Managing the music queue and current playback track
 * - Handling playlist operations (adding tracks, favorites)
 * - Managing search functionality
 * - Optimizing performance by only notifying on actual state changes
 */
export class SkytunesStore {
  // The current application state containing all data needed by the UI
  state: IState;

  // Array of listener functions that are called when state changes
  // Controllers subscribe to receive state updates
  listeners: Listener[];

  // Snapshot of the previous state used to detect actual changes
  // Prevents unnecessary notifications when state hasn't actually changed
  private previousState: Partial<IState>;

  // Toast notification controller for displaying user feedback messages
  toaster: ToastController;

  /**
   * Initialize the store with default state values
   * Sets up empty arrays and default settings for a fresh app start
   */
  constructor() {
    // Initialize the application state with default values
    this.state = {
      loading: false, // Loading indicator for async operations
      dashArtists: [], // Featured artists for dashboard carousel
      dashAlbums: [], // Featured albums for dashboard
      view: "dash", // Current view/page (defaults to dashboard)
      type: "dash", // Type of content being displayed
      displayedTracks: [], // Tracks shown in current view
      songList: [], // Queue of songs for playback
      announcerEnabled: true, // Whether AI DJ announcements are enabled
      chatType: "deep", // AI provider (deep/announce/claude)
      chatName: "Milton", // User's name for AI DJ
      chatZip: "", // User's ZIP code for local weather
      playlistGrid: [], // Featured playlists for dashboard
      displayedGrid: [], // Grid items (albums/artists/genres) in current view
      page: 1, // Current pagination page number
      count: 1, // Total count of items for pagination
      relatedPlaylists: [], // Array of track FileKeys that are in playlists (for favorites)
      artists: [], // List of all artists
    };

    // Initialize the listeners array (observers)
    this.listeners = [];

    // Initialize previous state snapshot as empty
    this.previousState = {};

    // Initialize toast notifications for user feedback
    this.toaster = new ToastController();
  }

  /**
   * Subscribe a listener function to state changes
   * When state changes, all subscribed listeners are called with the new state
   *
   * @param listener - Function to call when state changes
   * @returns Unsubscribe function that removes this listener
   */
  subscribe(listener: Listener) {
    // Add the listener to the array
    this.listeners.push(listener);

    // Return an unsubscribe function for cleanup
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all subscribed listeners of state changes
   * Only notifies if the state has actually changed (optimization)
   * Updates the previousState snapshot after notification
   */
  notify() {
    // Check if state has actually changed before notifying
    // This prevents unnecessary re-renders and processing
    if (this.hasStateChanged()) {
      // Call each listener function with the new state
      this.listeners.forEach((listener) => listener(this.state));

      // Update the previous state snapshot for next comparison
      this.previousState = { ...this.state };
    }
  }

  /**
   * Check if the state has actually changed since the last notification
   * Compares current state with previous state snapshot
   * Handles both primitive values and arrays correctly
   *
   * @returns true if any state property has changed, false otherwise
   */
  private hasStateChanged(): boolean {
    // Get all state keys for comparison
    const keys = Object.keys(this.state) as (keyof IState)[];

    // Check if any key has a different value
    return keys.some((key) => {
      const current = this.state[key];
      const previous = this.previousState[key];

      // Special handling for arrays - check length and contents
      if (Array.isArray(current) && Array.isArray(previous)) {
        return (
          current.length !== previous.length ||
          current.some((item, index) => item !== previous[index])
        );
      }

      // For primitives and objects, simple equality check
      return current !== previous;
    });
  }

  /**
   * Update the state with new values and notify listeners
   * Only updates and notifies if values actually change (optimization)
   * Automatically tracks the previous view for back navigation
   *
   * @param updates - Object containing state properties to update
   */
  setState(updates: Partial<IState>) {
    // Check if any of the updates actually change the state
    // This prevents unnecessary notifications and re-renders
    const hasChanges = Object.keys(updates).some((key) => {
      const stateKey = key as keyof IState;
      return this.state[stateKey] !== updates[stateKey];
    });

    // Only update state and notify if there are actual changes
    if (hasChanges) {
      this.state = {
        ...this.state,
        ...updates,
        // Track the previous view and ID for back navigation
        previous: {
          view: this.state.view,
          id: this.state.detailId,
        },
      };
      // Notify all listeners of the state change
      this.notify();
    }
  }

  /**
   * Set the song list (queue) and optionally the current playing song
   * Used when loading a new set of tracks (album, playlist, genre, etc.)
   *
   * @param songs - Array of tracks to set as the playback queue
   * @param song - Optional specific track to start playing
   */
  setSongList(songs: ITrackItem[], song?: ITrackItem) {
    this.setState({
      songList: songs, // The queue of songs
      currentSong: song || undefined, // Currently playing song
      currentSongId: song?.FileKey || undefined, // ID of current song for highlighting
    });
  }

  /**
   * Advance to the next or previous track in the queue
   * Handles navigation through the songList based on direction
   *
   * @param direction - 1 for next track, -1 for previous track
   */
  advanceTrack(direction: number) {
    // Get array of FileKeys from the song list
    const keys = this.state.songList.map((song) => song.FileKey);

    // Find the index of the currently playing song
    const index = keys.indexOf(this.state.currentSongId!);

    // Calculate the target index (next or previous)
    const nextIndex = index + direction;

    // Only advance if the target index is valid (within bounds)
    if (nextIndex >= 0 && nextIndex < this.state.songList.length) {
      const song = this.state.songList[nextIndex];
      this.setState({
        currentSong: song,
        currentSongId: song?.FileKey,
      });
    }
  }

  /**
   * Update the AI chat provider type
   *
   * @param chatType - The AI provider: "deep" (Deepseek), "announce" (ChatGPT), or "claude" (Claude)
   */
  setChatTypeValue(chatType: string) {
    this.setState({ chatType });
  }

  /**
   * Toggle whether AI DJ announcements are enabled
   *
   * @param enabled - true to enable AI DJ announcements, false to disable
   */
  setAnnouncerEnabledValue(enabled: boolean) {
    this.setState({ announcerEnabled: enabled });
  }

  /**
   * Add a track to the play queue
   * Inserts the track after the currently playing song, or after other queued tracks
   * Marks the track as "queued" so it can be distinguished from the original playlist
   *
   * @param track - The track to add to the queue
   */
  addToQueue(track: ITrackItem) {
    // Get array of FileKeys to find current song position
    const keys = this.state.songList.map((song) => song.FileKey);
    const index = keys.indexOf(this.state.currentSongId!);

    // Mark this track as queued (not part of the original playlist)
    const queuedTrack = {
      ...track,
      queued: true,
    };

    // Create a copy of the song list for modification
    const newSongList = [...this.state.songList];

    // Default: insert right after the current song
    let insertIndex = index + 1;

    // Find the last queued track after the current song
    // Insert after all other queued tracks to maintain queue order
    for (let i = this.state.songList.length - 1; i > index; i--) {
      if (this.state.songList[i].queued) {
        insertIndex = i + 1;
        break;
      }
    }

    // Insert the queued track at the calculated position
    newSongList.splice(insertIndex, 0, queuedTrack);
    this.setState({ songList: newSongList });

    // Show confirmation to user
    this.toaster.alert(`"${track.Title}" added to queue`, "Success!");
  }

  /**
   * Search for tracks, artists, and albums by a search term
   * Performs parallel searches across all three categories
   *
   * @param searchParam - The search query string
   */
  async searchByParam(searchParam: string) {
    // Perform three parallel searches for music, artists, and albums
    const searchResults = {
      music: await getSearch("music", searchParam),
      artist: await getSearch("artist", searchParam),
      album: await getSearch("album", searchParam),
    };

    // Update state with search results and switch to search view
    this.setState({ searchResults, searchParam, view: "search" });
  }

  /**
   * Load and display the artist banner for the current view
   * The banner shows artist info and artwork at the top of detail pages
   *
   * @param titleName - Override title (e.g., album name for album view)
   * @param trackCount - Number of tracks to display in the banner
   */
  async loadBanner(titleName: string = "", trackCount: number) {
    // Find a track with artist information from the displayed tracks
    const artistNode = this.state.displayedTracks.find((f) => !!f.artistFk);
    if (!artistNode?.artistFk) return;

    // Fetch the artist details
    const res = await getArtistDetail(artistNode.artistFk);
    if (!(res && res.row)) {
      // Clear the banner if artist not found
      return this.setState({ banner: undefined });
    }

    // Extract the artist data and construct banner props
    const [row] = res.row;
    const banner: BannerProps = {
      artistItem: row, // Artist data with image
      labelName: this.state.view, // Current view name (album, artist, etc.)
      titleName: titleName || row.Name, // Title to display (album name or artist name)
      trackCount, // Number of tracks
    };

    // Update state with banner data and render it
    this.setState({ banner });
    this.render();
  }

  /**
   * Render the artist banner to the DOM
   * Called after banner state is updated
   */
  render() {
    // Get the banner container element
    const art = document.getElementById("art");
    const { banner } = this.state;
    if (!art) return;

    // Clear the banner if no banner data exists
    if (!banner) art.innerHTML = "";

    // Render the banner HTML
    art.innerHTML = artistBanner(banner!);
  }

  // ===== Data Loading Methods =====
  // These methods fetch data from the API and update the state

  /**
   * Load album detail view
   * Fetches album info and tracks, then displays them
   *
   * @param id - The album ID
   */
  async loadAlbum(id: number) {
    const res = await getAlbumDetail(id);
    const [row] = res.row;

    // Update state with album tracks and switch to album view
    this.setState({
      displayedTracks: res.related.records.map(
        (t: ITrackItem) => this.matchTrack(t) // Mark tracks that are in playlists
      ),
      view: "album",
      type: "detail",
      count: 0,
      detailId: id.toString(),
      page: 0,
    });

    // Load the banner with album name
    this.loadBanner(row.Name, res.related.count);
  }

  /**
   * Load artist detail view
   * Fetches artist info and tracks, then displays them
   *
   * @param id - The artist ID
   */
  async loadArtist(id: number) {
    const res = await getArtistDetail(id);
    const [row] = res.row;

    // Update state with artist tracks and switch to artist view
    this.setState({
      displayedTracks: res.related.records.map(
        (t: ITrackItem) => this.matchTrack(t) // Mark tracks that are in playlists
      ),
      view: "artist",
      type: "detail",
      count: 0,
      detailId: id.toString(),
      page: 0,
    });

    // Load the banner with artist name
    this.loadBanner(row.Name, res.related.count);
  }

  /**
   * Load artists grid view with pagination
   *
   * @param page - The page number to load
   */
  async loadArtists(page: number) {
    const res = await getArtistGrid(page);

    // Update state with artist grid data
    this.setState({
      displayedGrid: res.records,
      view: "artists",
      type: "artist",
      page,
      count: res.count,
      detailId: undefined,
    });
  }

  /**
   * Load albums grid view with pagination
   *
   * @param page - The page number to load
   */
  async loadAlbums(page: number) {
    const res = await getAlbumGrid(page);

    // Update state with album grid data
    this.setState({
      displayedGrid: res.records,
      view: "albums",
      type: "album",
      page,
      count: res.count,
      detailId: undefined,
    });
  }

  /**
   * Load playlists grid view
   * No pagination for playlists
   */
  async loadPlaylists() {
    const res = await getPlaylistGrid();

    // Update state with playlist grid data
    this.setState({
      displayedGrid: res.records,
      view: "playlists",
      type: "playlist",
      count: res.count,
      detailId: undefined,
      page: 0,
    });
  }

  /**
   * Load genres grid view with pagination
   *
   * @param page - The page number to load
   */
  async loadGenres(page: number) {
    const res = await getGenreGrid(page);

    // Update state with genre grid data
    this.setState({
      displayedGrid: res.records,
      view: "genres",
      type: "genre",
      page,
      count: res.count,
      detailId: undefined,
    });
  }

  /**
   * Load library view (all tracks) with pagination
   *
   * @param page - The page number to load (defaults to 1)
   */
  async loadLibrary(page: number = 1) {
    const res = await getLibrary(page);

    // Update state with library tracks
    this.setState({
      displayedTracks: res.records.map((t: ITrackItem) => this.matchTrack(t)),
      view: "library",
      type: "",
      page,
      count: res.count,
      detailId: undefined,
    });

    // Load banner for library view
    this.loadBanner("", res.count);
  }

  /**
   * Load genre detail view
   * Fetches tracks for a specific genre with pagination
   *
   * @param genre - The genre name
   * @param page - The page number to load (defaults to 1)
   */
  async loadGenre(genre: string, page: number = 1) {
    // Replace forward slashes with asterisks for URL encoding
    const res = await getGenreDetail(genre.replace("/", "*"), page);

    // Update state with genre tracks
    this.setState({
      displayedTracks: res.related.records.map((t: ITrackItem) =>
        this.matchTrack(t)
      ),
      view: "genre",
      type: "detail",
      count: res.related.count,
      page,
      detailId: genre,
    });

    // Load banner with genre name
    this.loadBanner(genre, res.related.count);
  }

  /**
   * Load playlist detail view
   * Fetches tracks for a specific playlist
   *
   * @param key - The playlist key/ID
   */
  async loadPlaylist(key: string) {
    const res = await getPlaylistDetail(key);
    const [row] = res.row;

    // Update state with playlist tracks
    this.setState({
      displayedTracks: res.related.records.map((t: ITrackItem) =>
        this.matchTrack(t)
      ),
      view: "playlist",
      type: "detail",
      count: 0,
      detailId: key,
      page: 0,
    });

    // Load banner with playlist title
    this.loadBanner(row.Title, res.related.count);
  }

  /**
   * Load dashboard view
   * Fetches featured artists, albums, and playlists
   * Randomizes the order for variety on each load
   */
  async loadDash() {
    // Fetch dashboard data and playlists
    const data = await getDashboard();
    const lists = await getPlaylistGrid();

    // Filter and randomize featured artists (12 total)
    const dashArtists = data
      .filter((f: DashItem) => f.Type === "artist" && !!f.Caption)
      .sort(() => Math.random() - 0.5) // Shuffle randomly
      .slice(0, 12); // Take first 12

    // Filter and randomize featured albums (12 total)
    const dashAlbums = data
      .filter((f: DashItem) => f.Type === "album" && !!f.Caption)
      .sort(() => Math.random() - 0.5) // Shuffle randomly
      .slice(0, 12); // Take first 12

    // Randomize and limit playlists (8 total)
    const playlistGrid = lists.records
      .sort(() => Math.random() - 0.5) // Shuffle randomly
      .slice(0, 8); // Take first 8

    // Update state with dashboard data
    this.setState({
      dashAlbums,
      dashArtists,
      playlistGrid,
      playlistLib: lists.records, // Full playlist library for playlist operations
    });

    // Extract all track IDs that are in playlists (for favorite indicators)
    this.extractRelated(lists.records);
  }

  /**
   * Update a playlist by adding or removing a track
   * Toggles the track in the playlist's related array
   *
   * @param playlist - The playlist to update
   */
  async updateList(playlist: IPlaylistItem) {
    // Get the track that was right-clicked (from menu)
    const { menuTrack: currentTrack } = this.state;
    const { related } = playlist;
    const fileKey = currentTrack?.FileKey;

    // Toggle the track in the playlist
    const updated = {
      ...playlist,
      related:
        related.indexOf(fileKey!) > -1
          ? related.filter((f) => f !== fileKey!) // Remove if present
          : related.concat(fileKey!), // Add if not present
    };

    // Save the updated playlist to the backend
    await savePlaylist(updated);

    // Close the playlist menu
    this.setState({
      listOpen: false,
    });

    // Refresh playlist data and update favorite indicators
    this.rematch();

    // Show confirmation to user
    this.toaster.alert(
      `"${currentTrack?.Title}" added to playlist "${playlist.Title}"`,
      "Success!"
    );
  }

  /**
   * Mark a track as favorite if it's in any playlist
   * Checks if the track's FileKey exists in the relatedPlaylists array
   *
   * @param track - The track to check
   * @returns The track with favorite property set
   */
  matchTrack(track: ITrackItem) {
    const updated = {
      ...track,
      favorite:
        this.state.relatedPlaylists.indexOf(track?.FileKey) > -1 ? true : false,
    };
    return updated;
  }

  /**
   * Refresh playlist data and update favorite indicators on all displayed tracks
   * Called after playlist modifications to update the UI
   */
  async rematch() {
    // Fetch fresh playlist data
    const lists = await getPlaylistGrid();
    this.setState({
      playlistLib: lists.records,
    });

    // Extract track IDs from all playlists
    this.extractRelated(lists.records);

    // Re-mark all displayed tracks with updated favorite status
    this.setState({
      displayedTracks: this.state.displayedTracks.map((t: ITrackItem) =>
        this.matchTrack(t)
      ),
    });
  }

  /**
   * Extract all track FileKeys from playlist related arrays
   * Creates a flat array of all tracks that are in any playlist
   * Used to determine which tracks should show a favorite indicator
   *
   * @param records - Array of playlists
   */
  extractRelated(records: IPlaylistItem[]) {
    const relatedPlaylists: string[] = [];
    if (!records) return relatedPlaylists;

    // Loop through all playlists and extract their track IDs
    records.forEach((item) => {
      if (item.related && Array.isArray(item.related)) {
        relatedPlaylists.push(...item.related);
      }
    });

    // Update state with the flat array of all playlist track IDs
    this.setState({ relatedPlaylists });
  }

  /**
   * Initialize the application
   * Called on app startup to load the dashboard
   */
  async initializeApp() {
    this.loadDash();
  }
}
