import type { IState } from "../models";
import { SkytunesStore } from "../store";
import { appSettings } from "../views/settings";
import { ToastController } from "./toastController";

/**
 * Interface defining the structure of AI DJ settings
 * These settings control how the AI DJ interacts with users
 */
interface ISettings {
  // The AI model to use for DJ interactions
  // Options: "deep" (Deepseek), "announce" (ChatGPT), "claude" (Claude)
  type: string;

  // The name the AI DJ should use when addressing the user
  name: string;

  // The user's ZIP code for location-based features (e.g., local music events, weather)
  zip: string;
}

/**
 * SettingsController manages the AI DJ configuration settings
 * It handles:
 * - Loading settings from localStorage on app startup
 * - Rendering the settings UI
 * - Capturing user input and updating settings in real-time
 * - Saving settings to localStorage and updating the global state
 * - Displaying success notifications when settings are saved
 */
export class SettingsController {
  // Reference to the application's state store
  store: SkytunesStore;

  // Current AI DJ settings (AI model type, user name, ZIP code)
  settings: ISettings;

  // Name of the localStorage key where settings are persisted
  // This allows settings to persist across browser sessions
  COOKIE_NAME: string = "sky-tunes-settings";

  // Toast notification controller for displaying success/error messages
  toast;

  /**
   * Initialize the SettingsController
   * Sets up default settings, loads any previously saved settings,
   * binds event listeners, and initializes the toast notification system
   *
   * @param store - The application's state store
   */
  constructor(store: SkytunesStore) {
    this.store = store;

    // Initialize with default settings
    // These defaults are used if no settings have been previously saved
    this.settings = {
      type: "deep", // Default to Deepseek AI model
      name: "Milton", // Default user name
      zip: "30310", // Default ZIP code (Atlanta area)
    };

    // Attempt to load any previously saved settings from localStorage
    // This will override the defaults if saved settings exist
    this.loadSettings();

    // Set up event listeners for user interactions with settings controls
    this.bindEvents();

    // Initialize the toast notification system for user feedback
    this.toast = new ToastController();
  }

  /**
   * Render the settings view to the DOM
   * This displays the settings form where users can configure their AI DJ preferences
   *
   * @param state - The current application state to pass to the settings view
   */
  render(state: IState) {
    // Get the main app container element
    const app = document.getElementById("app");
    if (app) {
      // Replace the app content with the settings view
      app.innerHTML = appSettings(state);
    }
  }

  /**
   * Bind event listeners to handle user interactions with settings controls
   * Uses event delegation by listening at the document level with capture phase
   * This ensures events are captured even for dynamically added elements
   */
  bindEvents() {
    this.removeEventListeners();
    // Listen for clicks on the save settings button
    // Capture phase (true) ensures we catch events before they bubble
    document.addEventListener("click", this.handleClick.bind(this), true);

    // Listen for changes to select/radio inputs (AI model type selection)
    document.addEventListener("change", this.handleChange.bind(this), true);

    // Listen for input events on text fields (name and ZIP code)
    // Input events fire on every keystroke, allowing real-time updates
    document.addEventListener("input", this.handleInput.bind(this), true);
  }

  removeEventListeners() {
    // This method will be used to clean up event listeners if needed
    document.removeEventListener("click", this.handleClick);
    document.removeEventListener("input", this.handleInput);
    document.removeEventListener("change", this.handleChange);
  }

  /**
   * Handle click events, specifically for the save settings button
   * When the save button is clicked, persist the current settings
   *
   * @param e - The mouse event from the click
   */
  handleClick(e: MouseEvent) {
    // Stop the event from propagating to prevent unintended side effects
    e.stopPropagation();

    // Cast the event target to an Element for DOM manipulation
    let target = e.target as Element;

    // Check if the clicked element is the settings save button
    // Checks both direct matches and parent elements (via closest) for flexibility
    if (target.matches(".settings-btn") || target.closest(".settings-btn")) {
      // Prevent default button behavior (form submission, navigation, etc.)
      e.preventDefault();

      // Save the current settings to localStorage and update global state
      this.saveSettings();
    }
  }

  /**
   * Handle change events for select/radio inputs
   * Currently handles changes to the AI model type selection
   *
   * @param e - The change event from the input element
   */
  handleChange(e: Event) {
    // Cast the event target to an HTMLInputElement to access input properties
    let target = e.target as HTMLInputElement;

    // Check if the changed input is the AI model type selector
    if (target.name === "chatType") {
      // Update the settings object with the newly selected AI model type
      // Possible values: "deep" (Deepseek), "announce" (ChatGPT), "claude" (Claude)
      this.settings.type = target.value;
    }
  }

  /**
   * Handle input events for text fields
   * Updates settings in real-time as the user types
   * Currently handles the user name and ZIP code fields
   *
   * @param e - The input event from the text field
   */
  handleInput(e: Event) {
    // Cast the event target to an HTMLInputElement to access input properties
    let target = e.target as HTMLInputElement;

    // Check if the input is the user name field
    if (target.name === "chatName") {
      // Update the settings object with the current value
      // This name will be used by the AI DJ to address the user
      this.settings.name = target.value;
    }

    // Check if the input is the ZIP code field
    if (target.name === "chatZip") {
      // Update the settings object with the current value
      // This ZIP code can be used for location-based features
      this.settings.zip = target.value;
    }
  }

  /**
   * Load previously saved settings from localStorage
   * This is called during initialization to restore user preferences
   * If no saved settings exist, the default values from the constructor are used
   */
  loadSettings() {
    // Attempt to retrieve saved settings from localStorage
    const previous = localStorage.getItem(this.COOKIE_NAME);

    // If no saved settings exist, keep the default settings and exit early
    if (!previous) return;

    // Parse the saved JSON string back into a settings object
    this.settings = JSON.parse(previous);

    // Update the global state with the loaded settings
    // This ensures the rest of the app has access to the user's AI DJ preferences
    this.store.setState({
      chatType: this.settings.type, // AI model type (deep/announce/claude)
      chatName: this.settings.name, // User's name for the AI DJ
      chatZip: this.settings.zip, // User's ZIP code
    });
  }

  /**
   * Save the current settings to localStorage and update the global state
   * This is called when the user clicks the save button
   * Persists settings across browser sessions and provides user feedback
   */
  saveSettings() {
    // Persist the current settings to localStorage as a JSON string
    // This allows settings to survive page refreshes and browser restarts
    localStorage.setItem(this.COOKIE_NAME, JSON.stringify(this.settings));

    // Update the global application state with the new settings
    // This ensures all parts of the app have access to the updated preferences
    this.store.setState({
      chatType: this.settings.type, // AI model type (deep/announce/claude)
      chatName: this.settings.name, // User's name for the AI DJ
      chatZip: this.settings.zip, // User's ZIP code
    });

    // Display a success notification to confirm the settings were saved
    this.toast.alert("Settings successfully updated");
  }
}
