import type { DashItem } from "../models";

/**
 * CarouselController manages the artist image carousel on the dashboard
 * It handles:
 * - Auto-rotating through artist images every 5 seconds
 * - Manual navigation via previous/next arrows
 * - Direct navigation via indicator dots
 * - Smooth slide transitions with CSS animations
 * - Starting/stopping the carousel based on the current view
 * - Filtering artists to only show those with large images
 */
export class CarouselController {
  // Reference to the application's state store
  private store: any;

  // Array of artists that have large images suitable for the carousel
  // Filtered from the full artist list to exclude artists without images
  private validArtists: DashItem[] = [];

  // Index of the currently displayed artist in the validArtists array
  // Used to track which slide is active and calculate next/previous slides
  private currentCarouselIndex = 0;

  // Timer ID for the auto-advance interval (null when carousel is stopped)
  // Stored so we can clear it when the carousel is destroyed or paused
  private carouselInterval: number | null = null;

  /**
   * Initialize the CarouselController
   * Subscribes to store changes so the carousel can start/stop based on the current view
   *
   * @param store - The application's state store
   */
  constructor(store: any) {
    this.store = store;

    // Subscribe to store changes to know when the view changes
    // This allows us to start the carousel on the dashboard and stop it on other views
    this.store.subscribe(this.handleStoreChange.bind(this));

    console.log("CarouselController initialized successfully");
  }

  /**
   * Handle changes to the application state
   * Called whenever the store state changes
   * Starts the carousel when on the dashboard view, stops it otherwise
   */
  handleStoreChange() {
    // Check if we're currently on the dashboard view
    if (this.store.state.view === "dash") {
      // Initialize and start the carousel for the dashboard
      this.initializeApp();
    } else {
      // Stop the carousel and clean up when not on the dashboard
      // This prevents memory leaks and unnecessary processing
      this.destroyCarousel();
    }
  }

  /**
   * Initialize the carousel for the dashboard view
   * Sets up the artist list, event listeners, and starts auto-rotation
   * Clears any existing carousel first to prevent duplicate intervals
   */
  initializeApp() {
    // Clear any existing interval first to prevent multiple timers running
    this.destroyCarousel();

    // Reset to the first slide
    this.currentCarouselIndex = 0;

    // Filter the dashboard artists to only include those with large images
    // Artists without large images can't be displayed in the carousel
    this.validArtists = this.store.state.dashArtists.filter(
      (artist: DashItem) => artist.imageLg
    );

    // Set up click handlers for navigation arrows and indicator dots
    this.setupEventListeners();

    // Only start auto-rotation if there are multiple artists to show
    // With only one artist, there's nothing to rotate through
    if (this.validArtists.length > 1) {
      // Set up auto-advance: move to next slide every 5 seconds
      this.carouselInterval = window.setInterval(() => {
        this.handleCarouselNext();
      }, 5000);
    }
  }

  /**
   * Clean up the carousel by stopping auto-rotation and removing event listeners
   * Called when leaving the dashboard or before reinitializing
   * Prevents memory leaks and duplicate event handlers
   */
  destroyCarousel() {
    // Clear the auto-advance interval if it exists
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }

    // Remove event listener from the previous arrow button
    document
      .querySelector(".carousel-arrow-prev")
      ?.removeEventListener("click", this.handleCarouselPrev.bind(this));

    // Remove event listener from the next arrow button
    document
      .querySelector(".carousel-arrow-next")
      ?.removeEventListener("click", this.handleCarouselNext.bind(this));

    // Remove event listeners from all indicator dots
    document.querySelectorAll(".indicator").forEach((indicator, index) => {
      indicator.removeEventListener("click", () => this.goToSlide(index));
    });
  }

  /**
   * Set up event listeners for carousel navigation controls
   * Attaches click handlers to previous/next arrows and indicator dots
   * Removes existing listeners first to prevent duplicates
   */
  setupEventListeners() {
    // Remove existing listeners first to prevent duplicates
    // This is important because setupEventListeners might be called multiple times
    this.destroyCarousel();

    // Add click handler to the previous arrow button
    // Allows users to manually navigate backwards through the carousel
    document
      .querySelector(".carousel-arrow-prev")
      ?.addEventListener("click", this.handleCarouselPrev.bind(this));

    // Add click handler to the next arrow button
    // Allows users to manually navigate forwards through the carousel
    document
      .querySelector(".carousel-arrow-next")
      ?.addEventListener("click", this.handleCarouselNext.bind(this));

    // Add click handlers to indicator dots for direct navigation
    // Each dot corresponds to a specific slide index
    document.querySelectorAll(".indicator").forEach((indicator, index) => {
      indicator.addEventListener("click", () => this.goToSlide(index));
    });
  }

  /**
   * Handle clicking the next arrow or automatic advancement
   * Moves to the next slide in the carousel, wrapping around to the first slide after the last
   */
  handleCarouselNext() {
    // Calculate the next index, wrapping around to 0 if we're at the end
    const nextIndex =
      this.currentCarouselIndex === this.validArtists.length - 1
        ? 0 // Wrap to first slide after the last
        : this.currentCarouselIndex + 1; // Otherwise just increment

    // Perform the transition to the next slide with forward animation
    this.transitionToSlide(nextIndex, "next");
  }

  /**
   * Handle clicking the previous arrow
   * Moves to the previous slide in the carousel, wrapping around to the last slide before the first
   */
  handleCarouselPrev() {
    // Calculate the previous index, wrapping around to the end if we're at the beginning
    const prevIndex =
      this.currentCarouselIndex === 0
        ? this.validArtists.length - 1 // Wrap to last slide before the first
        : this.currentCarouselIndex - 1; // Otherwise just decrement

    // Perform the transition to the previous slide with backward animation
    this.transitionToSlide(prevIndex, "prev");
  }

  /**
   * Navigate directly to a specific slide (used by indicator dots)
   * Determines the appropriate transition direction based on target vs current index
   *
   * @param index - The index of the slide to navigate to
   */
  goToSlide(index: number) {
    // If we're already on this slide, do nothing
    if (index === this.currentCarouselIndex) return;

    // Determine transition direction based on whether we're moving forward or backward
    // This ensures the animation slides in the correct direction
    const direction = index > this.currentCarouselIndex ? "next" : "prev";

    // Perform the transition to the target slide
    this.transitionToSlide(index, direction);
  }

  /**
   * Perform an animated transition to a target slide
   * Creates a temporary second slide and uses CSS animations for smooth transitions
   *
   * @param targetIndex - The index of the slide to transition to
   * @param direction - The direction of the transition ("next" for forward, "prev" for backward)
   */
  transitionToSlide(targetIndex: number, direction: "next" | "prev") {
    // Get the carousel container element
    const container = document.querySelector(".carousel-container");
    if (!container) return;

    // Add a CSS class to trigger the transition animation
    // The "next" or "prev" class determines which direction the slides move
    container.classList.add(direction);

    // Create and add the target slide (the one we're transitioning TO)
    // This slide starts off-screen and animates into view
    const targetArtist = this.validArtists[targetIndex];
    const targetSlide = document.createElement("img");
    targetSlide.src = targetArtist.imageLg;
    targetSlide.alt = targetArtist.Name;
    targetSlide.className = `carousel-slide ${direction}`;

    // Store data attributes for potential click handling elsewhere in the app
    targetSlide.dataset.type = "artist";
    targetSlide.dataset.id = targetArtist.ID.toString();

    // Set up fallback image if the artist image fails to load
    targetSlide.onerror = function () {
      this.src = fallbackImage;
    };

    // Add the new slide to the container (now there are two slides temporarily)
    container.appendChild(targetSlide);

    // After the animation completes (800ms), finalize the transition
    setTimeout(() => {
      // Update the current index to the new slide
      this.currentCarouselIndex = targetIndex;

      // Clean up and show only the active slide
      this.updateCarousel();

      // Remove the transition class to reset for the next transition
      container.classList.remove(direction);
    }, 800);
  }

  /**
   * Update the carousel display after a transition completes
   * Replaces the container contents with only the current slide
   * Updates the title, counter, and indicator dots to match the current slide
   */
  updateCarousel() {
    // Get the artist data for the current slide
    const currentArtist = this.validArtists[this.currentCarouselIndex];

    // Get DOM elements that need updating
    const container = document.querySelector(".carousel-container");
    if (!container) return;

    const title = document.querySelector(".info-title");
    const counter = document.querySelector(".carousel-counter");

    // Update image - keep only the active slide
    // This removes any temporary slides created during transitions
    const newImg = document.createElement("img");
    newImg.src = currentArtist.imageLg;
    newImg.alt = currentArtist.Name;
    newImg.className = "carousel-slide active";

    // Store data attributes for potential click handling elsewhere in the app
    newImg.dataset.type = "artist";
    newImg.dataset.id = currentArtist.ID.toString();

    // Set up fallback image if the artist image fails to load
    newImg.onerror = function () {
      this.src = fallbackImage;
    };

    // Clear the container and add only the current slide
    // This removes any leftover slides from the transition animation
    container.innerHTML = "";
    container.appendChild(newImg);

    // Update the artist name text
    if (title) title.textContent = currentArtist.Name;

    // Update the slide counter text (e.g., "2 of 5 •")
    if (counter) {
      counter.textContent =
        this.currentCarouselIndex +
        1 + // Add 1 because indices are 0-based but display is 1-based
        " of " +
        this.validArtists.length +
        " • "; // Bullet separator for design
    }

    // Update indicator dots to highlight the current slide
    // Active indicator gets highlighted, all others are dimmed
    document.querySelectorAll(".indicator").forEach((el, index) => {
      if (index === this.currentCarouselIndex) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  }
}

// Fallback image to display when an artist image fails to load
// TBD: Should be replaced with an actual path to a default/placeholder image
const fallbackImage = "path/to/fallback/image.jpg";
