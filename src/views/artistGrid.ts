import { createCard, pagination } from "../components";
import type { IState } from "../models";

/**
 * Generate the HTML markup for a responsive grid of artists/albums/genres
 * This function creates a Bootstrap grid layout with cards representing music items
 *
 * The grid is responsive with different column counts at different breakpoints:
 * - Mobile (default): 2 columns
 * - Small (sm): 2 columns
 * - Medium (md): 3 columns
 * - Large (lg): 6 columns
 *
 * @param state - The current application state containing:
 *   - displayedGrid: Array of items to display in the grid
 *   - type: The type of items being displayed (artist, album, genre, playlist)
 *   - Pagination state for the pagination component
 * @returns HTML string representing the complete grid with pagination and cards
 */
export function artistGrid(state: IState) {
  // Start building the HTML with a Bootstrap row container
  // The first row contains the pagination controls above the grid
  let htm = `<div class="row">
    
  ${pagination(state)}
  
  </div><div class="row m-1">`;

  // Map each item in the displayedGrid to a Bootstrap column containing a card
  // The grid adapts its layout based on screen size using Bootstrap's responsive classes
  htm += state.displayedGrid
    .map(
      (item) =>
        // Create a responsive column that adjusts width based on viewport size
        // col-6: 2 columns on mobile (50% width)
        // col-sm-6: 2 columns on small screens (50% width)
        // col-md-4: 3 columns on medium screens (33% width)
        // col-lg-2: 6 columns on large screens (16.6% width)
        // p-1: Small padding around each card
        `<div class="col-6 col-sm-6 col-md-4 col-lg-2 p-1">${createCard({
          // Determine the card title based on what type of item this is
          // Uses Genre for genre items, Title for tracks, or Name for artists/albums
          title: item.Genre || item.Title || item.Name,

          // Determine the card image based on what's available in the item data
          // Priority: albumImage > image > Thumbnail
          // Different item types may have different image property names
          image: item.albumImage || item.image || item.Thumbnail,

          // Pass through the type from state (artist, album, genre, playlist)
          // This helps the card component know what type of item it's displaying
          type: state.type,

          // Display track count as the caption below the card image/title
          // Shows how many tracks are in this artist/album/genre/playlist
          caption: item.TrackCount + " tracks",

          // Use listKey if available (for genres/playlists), otherwise use ID
          // Some items use listKey as their identifier, others use numeric ID
          // Convert ID to string for consistency
          ID: item.listKey || item.ID?.toString(),
        })}</div>`
    )
    .join(""); // Join all the column HTML strings into one continuous string

  // Close the row container
  htm += `</div>`;

  // Return the complete HTML string for the grid
  return htm;
}
