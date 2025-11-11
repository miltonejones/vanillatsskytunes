// Import type definitions for TypeScript type checking
import type { IPlaylistItem, IState, ITrackItem } from "./models";

// Import CSS styles for various components
import "./styles/style.css";
import "./styles/drawer.css";
import "./styles/audio-player.css";
import "./styles/carousel.css";

// Import component rendering functions
import { renderNavbar } from "./components";

// Import controller classes for managing different aspects of the application
import {
  AudioPlayer,
  CarouselController,
  SettingsController,
  URLController,
} from "./controllers";

// Import the main store class for state management
import { SkytunesStore } from "./store";

// Import view rendering functions for different application views
import { artistGrid, dashBoard, playlistDetail, searchResults } from "./views";

// Import additional controller for toast functionality
import { ToastController } from "./controllers/toastController";

// Main application class that orchestrates the entire Skytunes application
export class SkytunesApp {
  // Store instance for state management
  store;
  // Flag to track if the app has been initialized
  initialized = false;
  // Controller for managing URL routing and history
  urlController;
  // Controller for managing carousel functionality
  carouselController;
  // Controller for managing application settings
  settingsController;
  // Audio player controller for handling music playback
  audioPlayer;
  // Toast controller for alerts
  toaster;

  // Constructor initializes all controllers and the store
  constructor() {
    // Create a new store instance for state management
    this.store = new SkytunesStore();
    // Initialize URL controller with store reference
    this.urlController = new URLController(this.store);
    // Initialize carousel controller with store reference
    this.carouselController = new CarouselController(this.store);
    // Initialize audio player with store reference
    this.audioPlayer = new AudioPlayer(this.store);
    // Initialize settings controller with store reference
    this.settingsController = new SettingsController(this.store);
    // Initialize toast controller for warnings
    this.toaster = new ToastController();
  }

  // Initialize the application, waiting for DOM if necessary
  async init() {
    // Check if DOM is still loading
    if (document.readyState === "loading") {
      // If DOM is loading, wait for DOMContentLoaded event before initializing
      document.addEventListener("DOMContentLoaded", () => this.initializeApp());
    } else {
      // If DOM is already ready, initialize immediately
      await this.initializeApp();
    }
  }

  // Main initialization method that sets up the application
  async initializeApp() {
    // Check if store exists
    if (this.store) {
      // Subscribe to store changes to re-render when state updates
      this.store.subscribe((state: IState) => {
        // Re-render the application with new state
        this.render(state);
        // Update URL to reflect current state
        this.urlController.updateURL(state); // Update URL when state changes
      });

      // Initialize URL controller for routing
      this.urlController.init();

      // Initialize the store (load initial data, etc.)
      await this.store.initializeApp();
      // Perform initial render with current state
      this.render(this.store.state);
      // Mark app as initialized
      this.initialized = true;
      // Bind event listeners after a short delay to ensure DOM is ready
      setTimeout(() => {
        this.bindEvents();
      }, 100);
      return;
    }
    // Fallback error if store fails to initialize
    this.toaster.alert("Store did not load. Please try again", "Load failed!");
  }

  // Main rendering method that updates the UI based on current state
  render(state: IState) {
    // Default content if no view matches
    let content = "No content configured for this view - " + state.view;

    // Switch statement to determine which view to render based on state.view
    switch (state.view) {
      case "dash":
        // Render dashboard view
        content = dashBoard(state);
        break;
      case "album":
      case "artist":
      case "genre":
      case "playlist":
      case "library":
        // Render playlist detail view for detail content types
        content = playlistDetail(state);
        break;
      case "artists":
      case "genres":
      case "albums":
      case "playlists":
        // Render grid view for collections of items
        content = artistGrid(state);
        break;
      case "search":
        // Render search results view
        content = searchResults(state);
        break;
      case "settings":
        // Delegate settings rendering to settings controller
        return this.settingsController.render(state);
      default:
      // do nothing - keep default content
    }

    // Get references to main navigation and application content elements
    const nav = document.getElementById("nav");
    const app = document.getElementById("app");

    // Update navigation if element exists
    if (nav) {
      nav.innerHTML = renderNavbar(state);
    }
    // Update main content if element exists
    if (app) {
      app.innerHTML = content;
    }
  }

  // Bind global event listeners for user interactions
  bindEvents() {
    this.removeEventListeners();
    // Add click event listener with binding to maintain 'this' context
    document.addEventListener("click", this.handleClick.bind(this), true);
    // Add input event listener with binding to maintain 'this' context
    document.addEventListener("input", this.handleInput.bind(this), true);
  }

  removeEventListeners() {
    // This method will be used to clean up event listeners if needed
    document.removeEventListener("click", this.handleClick);
    document.removeEventListener("input", this.handleInput);
  }

  // Handle input events from form elements and other inputs
  handleInput(e: Event) {
    // Log for debugging
    console.log("handleInput");
    // Cast target to HTMLInputElement for TypeScript typing
    let target = e.target as HTMLInputElement;
    // Variable to store timeout ID for debouncing
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Define search handler function
    const handleSearch = (param: string) => {
      // Trigger search in store with provided parameter
      this.store.searchByParam(param);
    };

    // Check if the input is a search input or contained within one
    if (target.matches(".search-input") || target.closest(".search-input")) {
      // Prevent default behavior
      e.preventDefault();
      // Clear existing timeout if any
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Set new timeout for debounced search (999ms delay)
      timeoutId = setTimeout(() => handleSearch(target.value), 999);
      return;
    }
  }

  // Handle click events throughout the application
  handleClick(e: MouseEvent) {
    // Log for debugging
    console.log("handleClick");
    // Prevent event from bubbling up
    e.stopPropagation();

    // Cast target to Element for DOM manipulation
    let target = e.target as Element;

    // Handle queue addition clicks (elements with data-queue-id attribute)
    if (
      target.matches("[data-queue-id]") ||
      target.closest("[data-queue-id]")
    ) {
      e.preventDefault();
      // Find the closest element with data-queue-id attribute
      const viewElement = target.closest("[data-queue-id]");
      // Get the ID from the data attribute
      const ID = viewElement!.getAttribute("data-queue-id");
      // Get currently displayed tracks from store state
      const displayedTracks = this.store.state.displayedTracks;
      // Find the specific track by ID
      const track = displayedTracks?.find(
        (t: ITrackItem) => t.ID?.toString() === ID
      );
      // If track found, add it to the queue
      if (track) {
        this.store.addToQueue(track);
      }
    }

    // Handle track selection clicks (elements with data-track-id attribute)
    if (
      target.matches("[data-track-id]") ||
      target.closest("[data-track-id]")
    ) {
      e.preventDefault();
      // Find the closest element with data-track-id attribute
      const viewElement = target.closest("[data-track-id]");
      // Get the ID from the data attribute
      const ID = viewElement!.getAttribute("data-track-id");
      // Determine which track list to use based on current view
      let displayedTracks =
        this.store.state.view === "search"
          ? this.store.state.searchResults?.music.records
          : this.store.state.displayedTracks;

      // Special case for playlist items
      if (viewElement?.classList.contains("playlist-item")) {
        displayedTracks = this.store.state.songList;
      }

      // Find the specific track by ID
      const track = displayedTracks?.find(
        (t: ITrackItem) => t.ID?.toString() === ID
      );
      // If track found, set it as current song and update song list
      if (track) {
        this.store.setSongList(displayedTracks!, track);
      }

      return;
    }

    // Handle view navigation clicks (elements with data-view attribute)
    if (target.matches("[data-view]") || target.closest("[data-view]")) {
      e.preventDefault();
      // Find the closest element with data-view attribute
      const viewElement = target.closest("[data-view]");
      // Get the view name from data attribute
      const view = viewElement!.getAttribute("data-view");
      // Get page number from data attribute, default to 1
      const page = Number(viewElement!.getAttribute("data-page") || 1);
      // Use URL controller to handle the view change
      this.urlController.handleViewChange(view!, page);
      return;
    }

    // Handle search result filter clicks (elements with data-result attribute)
    if (target.matches("[data-result]") || target.closest("[data-result]")) {
      e.preventDefault();

      // Find the closest element with data-result attribute
      const viewElement = target.closest("[data-result]");
      // Get the result type from data attribute
      const type = viewElement!.getAttribute("data-result");

      // Update active state for all result filter buttons
      document.querySelectorAll("[data-result]").forEach((el) => {
        el.classList.toggle("active", el.getAttribute("data-result") === type);
      });
      // Show/hide result sections based on selected type
      document.querySelectorAll(".result").forEach((el) => {
        el.classList.toggle(
          "show",
          el.getAttribute("data-result-type") === type
        );
      });
    }

    // Handle drawer button clicks for side menus
    if (target.matches(".drawer-btn") || target.closest(".drawer-btn")) {
      e.preventDefault();

      // Find the closest drawer button element
      const viewElement = target.closest(".drawer-btn");
      // Get the drawer ID from data attribute
      const id = viewElement!.getAttribute("data-drawer-id");
      // Find the track associated with this drawer
      const menuTrack = this.store.state.displayedTracks?.find(
        (t: ITrackItem) => t.ID?.toString() === id
      );

      // Toggle drawer open state and set the menu track
      this.store.setState({
        drawerOpen: !this.store.state.drawerOpen,
        menuTrack,
        right: true,
      });
    }

    // Handle add to playlist clicks (elements with data-add-id attribute)
    if (target.matches("[data-add-id]") || target.closest("[data-add-id]")) {
      e.preventDefault();

      // Find the closest element with data-add-id attribute
      const viewElement = target.closest("[data-add-id]");
      // Get the playlist ID from data attribute
      const id = viewElement!.getAttribute("data-add-id");
      // Find the playlist in the library
      const menuList = this.store.state.playlistLib?.find(
        (t: IPlaylistItem) => t.listKey?.toString() === id
      );

      // Update the playlist with current selection
      this.store.updateList(menuList!);
    }

    // Handle list menu clicks (elements with data-list-id attribute)
    if (target.matches("[data-list-id]") || target.closest("[data-list-id]")) {
      e.preventDefault();

      // Find the closest element with data-list-id attribute
      const viewElement = target.closest("[data-list-id]");
      // Get the track ID from data attribute
      const id = viewElement!.getAttribute("data-list-id");
      // Find the track in displayed tracks
      const menuTrack = this.store.state.displayedTracks?.find(
        (t: ITrackItem) => t.ID?.toString() === id
      );

      // Toggle list menu open state and set the menu track
      this.store.setState({
        listOpen: !this.store.state.listOpen,
        menuTrack,
      });
    }

    // Handle detail view navigation (elements with data-type attribute)
    if (target.matches("[data-type]") || target.closest("[data-type]")) {
      e.preventDefault();
      // Find the closest element with data-type attribute
      const viewElement = target.closest("[data-type]");
      // Get the content type from data attribute
      const type = viewElement!.getAttribute("data-type");
      // Get the content ID from data attribute
      const ID = viewElement!.getAttribute("data-id");
      // Get the page number from data attribute, default to 1
      const page = viewElement!.getAttribute("data-page") || "1";
      // Use URL controller to navigate to detail view
      this.urlController.handleDetailChange(type!, ID!, page);

      return;
    }
  }
}

// Initialize the application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Create a new instance of the main application class
  const app = new SkytunesApp();
  // Start the application initialization process
  app.init();
});
