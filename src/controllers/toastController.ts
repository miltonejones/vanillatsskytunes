/**
 * ToastController manages temporary notification messages (toasts) that appear on screen
 * Toasts are used to provide brief feedback to users about actions they've taken
 * (e.g., "Settings saved", "Song added to playlist", "Error occurred")
 *
 * The controller handles:
 * - Displaying toast notifications with customizable title, message, and caption
 * - Automatically hiding toasts after a set duration
 * - Updating existing toast DOM elements with new content
 */
export class ToastController {
  /**
   * Initialize the ToastController
   * No setup is required as the controller operates on existing DOM elements
   * The toast HTML structure is expected to already exist in the page
   */
  constructor() {}

  /**
   * Display a toast notification with the specified content
   * The toast automatically appears with a CSS animation and disappears after ~5 seconds
   *
   * @param message - The main message body to display (required)
   * @param title - The toast title/header (defaults to "Skytunes")
   * @param caption - Optional additional text/subtitle (defaults to empty string)
   */
  alert(message: string, title: string = "Skytunes", caption: string = "") {
    // Query for the toast DOM elements that need to be updated
    // These elements are expected to exist in the page's HTML structure
    const titleEl = document.querySelector(".toast-title");
    const captionEl = document.querySelector(".toast-caption");
    const body = document.querySelector(".toast-body");
    const toast = document.querySelector(".toast");

    // Verify all required elements exist before attempting to show the toast
    // If any element is missing, the toast cannot be displayed properly
    if (body && toast && captionEl && titleEl) {
      // Update the toast content with the provided message, title, and caption
      // Using innerHTML allows for basic HTML formatting in the message if needed
      body.innerHTML = message;
      captionEl.innerHTML = caption;
      titleEl.innerHTML = title;

      // Add the "show" class to trigger the CSS animation that makes the toast visible
      // This typically slides the toast into view or fades it in
      toast.classList.add("show");

      // Set a timer to automatically hide the toast after approximately 5 seconds
      // The 4999ms duration (just under 5 seconds) allows the hide animation to complete smoothly
      setTimeout(() => {
        // Remove the "show" class to trigger the CSS animation that hides the toast
        // This typically slides the toast out of view or fades it out
        toast.classList.remove("show");
      }, 4999);
    }
  }
}
