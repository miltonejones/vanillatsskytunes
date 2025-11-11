import { SkytunesStore } from "../store";

/**
 * URLController manages the synchronization between the application's URL hash
 * and the application state. It handles both directions of updates:
 * - When the URL changes (user clicks back/forward or manually edits URL)
 * - When the state changes (user navigates within the app)
 */
export class URLController {
  // Reference to the application's state store
  private store: SkytunesStore;

  // List of all valid view names that the application supports
  // Used to validate URLs and prevent navigation to invalid views
  private validViews = [
    "dash",
    "library",
    "artists",
    "albums",
    "genres",
    "playlists",
    "album",
    "artist",
    "genre",
    "playlist",
    "search",
  ];

  // Flag to prevent infinite loops when URL changes trigger state updates
  // Set to true when we're updating state based on a URL change
  private isUpdatingFromURL = false;

  // Flag to prevent infinite loops when state changes trigger URL updates
  // Set to true when we're updating the URL based on a state change
  private isUpdatingFromState = false;

  /**
   * Initialize the URLController with a reference to the application store
   * @param store - The application's state store that contains navigation state
   */
  constructor(store: SkytunesStore) {
    this.store = store;
  }

  /**
   * Parse the current URL hash into its component parts without triggering any state updates
   * URL format: #view/detailId/page
   * Examples:
   *   #dash -> { view: "dash" }
   *   #album/123 -> { view: "album", detailId: "123" }
   *   #genre/rock/2 -> { view: "genre", detailId: "rock", page: 2 }
   *
   * @returns An object containing the parsed view, optional detailId, and optional page number
   */
  parseURL(): { view: string; detailId?: string; page?: number } {
    // Get the hash from the URL, removing the leading '#' character
    const hash = window.location.hash.substring(1);

    // If there's no hash, default to the dashboard view
    if (!hash) return { view: "dash" };

    // Split the hash into its component parts using '/' as delimiter
    const parts = hash.split("/");
    const view = parts[0];
    const detailId = parts[1];
    // Parse the page number if it exists, otherwise undefined
    const page = parts[2] ? parseInt(parts[2]) : undefined;

    // Return the parsed components, validating that the view is recognized
    // If the view is not in validViews array, default to "dash"
    return {
      view: this.validViews.includes(view) ? view : "dash",
      detailId,
      page,
    };
  }

  /**
   * Handle URL changes (e.g., from browser back/forward buttons or manual hash edits)
   * This method parses the current URL and updates the application state accordingly
   * It includes protection against infinite update loops
   */
  handleURLChange() {
    // Exit early if we're already updating from a state change
    // This prevents infinite loops where state changes trigger URL changes which trigger state changes
    if (this.isUpdatingFromState) return;

    // Set flag to indicate we're updating state based on URL
    // This prevents the state update from triggering another URL update
    this.isUpdatingFromURL = true;

    // Parse the current URL to get the desired view, detail ID, and page
    const { view, detailId, page } = this.parseURL();

    // Only update state if something actually changed
    // This optimization prevents unnecessary re-renders and data fetches
    const currentState = this.store.state;
    if (currentState.view !== view || currentState.detailId !== detailId) {
      // If there's a detailId, we're navigating to a detail view (album, artist, etc.)
      if (detailId) {
        this.handleDetailChange(view, detailId, page?.toString() || "1");
      } else {
        // Otherwise, we're navigating to a list view (library, artists, etc.)
        this.handleViewChange(view, page || 1);
      }
    }

    // Reset the flag after the current event loop cycle completes
    // Using setTimeout with 0 ensures all synchronous state updates are complete
    setTimeout(() => {
      this.isUpdatingFromURL = false;
    }, 0);
  }

  /**
   * Handle navigation to detail views (individual albums, artists, genres, playlists)
   * This method calls the appropriate store method to load the detailed data
   *
   * @param type - The type of detail view (album, artist, genre, playlist)
   * @param id - The ID of the item to load
   * @param page - The page number for paginated detail views (defaults to "1")
   */
  handleDetailChange(type: string, id: string, page: string = "1") {
    if (type === "album") {
      // Load a specific album by its numeric ID
      this.store.loadAlbum(Number(id));
    } else if (type === "artist") {
      // Load a specific artist by their numeric ID
      this.store.loadArtist(Number(id));
    } else if (type === "genre") {
      // Load a specific genre with pagination support
      // Genre IDs are strings (e.g., "rock", "jazz")
      this.store.loadGenre(id, Number(page));
    } else if (type === "playlist") {
      // Load a specific playlist by its string ID
      this.store.loadPlaylist(id);
    }
  }

  /**
   * Handle navigation to list views (library, artists, albums, etc.)
   * This method calls the appropriate store method to load the list data
   *
   * @param view - The name of the view to navigate to
   * @param page - The page number for paginated views (defaults to 1)
   */
  handleViewChange(view: string, page: number = 1) {
    switch (view) {
      case "library":
        // Load the main library view with pagination
        this.store.loadLibrary(page);
        break;
      case "artists":
        // Load the artists list view with pagination
        this.store.loadArtists(page);
        break;
      case "playlists":
        // Load the playlists list view (no pagination)
        this.store.loadPlaylists();
        break;
      case "albums":
        // Load the albums list view with pagination
        this.store.loadAlbums(page);
        break;
      case "genres":
        // Load the genres list view with pagination
        this.store.loadGenres(page);
        break;
      default:
        // For views that don't need data loading (like "dash" or "search"),
        // just update the view state directly
        this.store.setState({ view });
    }
  }

  /**
   * Update the URL hash based on the current application state
   * This is called when the user navigates within the app (not by changing the URL directly)
   * The URL is constructed from the state's view, detailId, and page properties
   *
   * @param state - The current application state
   */
  updateURL(state: any) {
    // Exit early if we're already updating from a URL change
    // This prevents infinite loops where URL changes trigger state changes which trigger URL changes
    if (this.isUpdatingFromURL) return;

    // Set flag to indicate we're updating URL based on state
    // This prevents the URL update from triggering another state update
    this.isUpdatingFromState = true;

    // Build the new hash URL as an array of parts
    // Start with the view (always present)
    const newHash = [`#${state.view}`];

    // Add the detail ID if present (for detail views like album/123)
    if (state.detailId) {
      newHash.push(state.detailId);
    }

    // Add the page number if present and greater than 1
    // We omit page 1 to keep URLs cleaner (page 1 is the default)
    if (state.page && state.page > 1) {
      newHash.push(state.page.toString());
    }

    // Join the parts with '/' to create the final hash string
    const newURL = newHash.join("/");

    // Only update the browser's location if the hash actually changed
    // This prevents adding duplicate entries to the browser history
    if (window.location.hash !== newURL) {
      window.location.hash = newURL;
    }

    // Reset the flag after the current event loop cycle completes
    // Using setTimeout with 0 ensures all synchronous URL updates are complete
    setTimeout(() => {
      this.isUpdatingFromState = false;
    }, 0);
  }

  /**
   * Initialize the URLController by setting up event listeners and handling the initial URL
   * This should be called once when the application starts
   * It sets up the hashchange listener and processes any initial hash in the URL
   */
  init() {
    // Listen for hash changes (browser back/forward buttons, manual URL edits)
    // When the hash changes, update the application state accordingly
    window.addEventListener("hashchange", () => this.handleURLChange());

    // Initial URL check - don't trigger if it matches default state
    // Parse the initial URL to see if we need to navigate somewhere
    const urlState = this.parseURL();

    // Only handle the initial URL if it's not the default state
    // This prevents unnecessary navigation on app startup when the user is at #dash
    if (urlState.view !== "dash" || urlState.detailId) {
      this.handleURLChange();
    }
  }
}
