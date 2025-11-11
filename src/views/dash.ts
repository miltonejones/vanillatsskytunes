import { createCard, ArtistCarousel, horizontalCard } from "../components";
import type { IState } from "../models";

/**
 * Create a URL-safe key from a playlist name
 * Removes spaces, ampersands, and hyphens, then converts to lowercase
 * This creates consistent, URL-friendly identifiers for playlists
 *
 * Examples:
 *   "Rock & Roll" -> "rockroll"
 *   "Hip-Hop Classics" -> "hiphopclassics"
 *   "90s Pop" -> "90spop"
 *
 * @param name - The playlist name to convert
 * @returns A sanitized, lowercase string suitable for use as a URL parameter or key
 */
const createKey = (name: string) => name.replace(/[\s&-]/g, "").toLowerCase();

/**
 * Generate the HTML markup for the dashboard/home page
 * The dashboard displays a curated view of the music library with:
 * - A rotating artist carousel at the top
 * - Featured playlists section (horizontal cards, 4 columns on large screens)
 * - Featured albums section (vertical cards, 6 columns on large screens)
 * - Featured artists section (vertical cards, 6 columns on large screens)
 *
 * All sections use responsive Bootstrap grid layouts that adapt to different screen sizes
 *
 * @param state - The current application state containing:
 *   - dashArtists: Array of featured artists for the carousel and artist section
 *   - playlistGrid: Array of featured playlists to display
 *   - dashAlbums: Array of featured albums to display
 * @returns HTML string representing the complete dashboard layout
 */
export function dashBoard(state: IState) {
  // Initialize the HTML string that will be built up section by section
  let html = "";

  // Add the artist carousel at the top of the dashboard
  // This creates a large, auto-rotating showcase of featured artist images
  html += ArtistCarousel(state);

  // Start the main content container and begin the Featured Playlists section
  // The scroll emoji (📜) provides a visual indicator for this section
  html += `<div class="container-fluid"><div class="row"><h4>📜 Featured playlists</h4></div><div class="row mb-1">`;

  // Map each playlist to a horizontal card within a responsive column
  // Horizontal cards show the playlist image, title, and track count side-by-side
  html += state.playlistGrid
    .map(
      (f) =>
        // Create responsive columns for playlists:
        // col-6: 2 columns on mobile (50% width)
        // col-sm-6: 2 columns on small screens (50% width)
        // col-md-4: 3 columns on medium screens (33% width)
        // col-lg-3: 4 columns on large screens (25% width)
        `<div class="col-6 col-sm-6 col-md-4 col-lg-3">${horizontalCard(
          f.image, // Playlist cover image
          f.Title, // Playlist name
          f.related.length + " tracks", // Caption showing number of tracks
          "playlist", // Type identifier for navigation
          f.listKey || createKey(f.Title) // Use existing listKey or generate one from title
        )}</div>`
    )
    .join(""); // Combine all playlist cards into one HTML string

  // Close the playlists row
  html += "</div>";

  // Begin the Featured Albums section
  // The CD emoji (💿) provides a visual indicator for this section
  html += `<div class="row"><h4>💿 Featured albums</h4></div><div class="row mb-1">`;

  // Map each album to a vertical card within a responsive column
  // Vertical cards show album art on top with title and caption below
  html += state.dashAlbums
    .map(
      (item) =>
        // Create responsive columns for albums:
        // col-6: 2 columns on mobile (50% width)
        // col-sm-6: 2 columns on small screens (50% width)
        // col-md-4: 3 columns on medium screens (33% width)
        // col-lg-2: 6 columns on large screens (16.6% width)
        // p-1: Small padding around each card
        `<div class="col-6 col-sm-6 col-md-4 col-lg-2 p-1">${createCard({
          image: item.Thumbnail, // Album cover image
          title: item.Name, // Album name
          caption: item.Caption, // Artist name or additional info
          type: "album", // Type identifier for navigation
          ID: item.ID.toString(), // Album ID converted to string
        })}</div>`
    )
    .join(""); // Combine all album cards into one HTML string

  // Close the albums row
  html += `</div>`;

  // Begin the Featured Artists section
  // The fencer emoji (🤺) provides a visual indicator for this section
  html += `<div class="row">`;
  html += `<h4>🤺 Featured artists</h4>`;

  // Map each artist to a vertical card within a responsive column
  // Uses the same card layout as albums but with artist data
  html += state.dashArtists
    .map(
      (item) =>
        // Create responsive columns for artists (same breakpoints as albums):
        // col-6: 2 columns on mobile (50% width)
        // col-sm-6: 2 columns on small screens (50% width)
        // col-md-4: 3 columns on medium screens (33% width)
        // col-lg-2: 6 columns on large screens (16.6% width)
        // p-1: Small padding around each card
        `<div class="col-6 col-sm-6 col-md-4 col-lg-2 p-1">${createCard({
          image: item.Thumbnail, // Artist profile image
          title: item.Name, // Artist name
          caption: item.Caption, // Number of tracks or additional info
          type: "artist", // Type identifier for navigation
          ID: item.ID.toString(), // Artist ID converted to string
        })}</div>`
    )
    .join(""); // Combine all artist cards into one HTML string

  // Close the artists row and main container
  html += `</div>`;
  html += `</div>`;

  // Return the complete dashboard HTML
  return html;
}
