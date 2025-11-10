import type { IState } from "../models";

export function ArtistCarousel(state: IState): string {
  const { dashArtists: artists } = state;

  // Filter out any artists that might have lost their imageLg property
  const validArtists = artists?.filter((artist) => artist.imageLg);

  if (!validArtists || validArtists.length === 0)
    return "<div>No artists to display</div>";

  // Start with first artist as current
  const currentIndex = 0;
  const currentArtist = validArtists[currentIndex];

  if (!currentArtist) {
    return '<div class="spinner">Loading...</div>';
  }

  // Generate indicators
  const indicators = validArtists
    .map(
      (_, index) =>
        `<button class="indicator ${index === currentIndex ? "active" : ""}" 
              data-index="${index}">
       </button>`
    )
    .join("");

  // Generate navigation arrows
  const arrows =
    validArtists.length > 1
      ? `
      <button class="carousel-arrow carousel-arrow-prev">‹</button>
      <button class="carousel-arrow carousel-arrow-next">›</button>
    `
      : "";

  return `
      <div class="carousel-outer mb-2">
        <div class="carousel-container">
          <!-- Current active slide -->
          <img src="${currentArtist.imageLg}" 
               alt="${currentArtist.Name}" 
               class="carousel-slide active"
               onerror="this.src='${fallbackImage}'">
        </div>
  
        <!-- Carousel indicators -->
        ${
          validArtists.length > 1
            ? `
          <div class="carousel-indicators">
            ${indicators}
          </div>
        `
            : ""
        }
  
        ${arrows}
  
        <div class="carousel-box">
          <div class="info-label">Artist</div>
          <div class="info-title">${currentArtist.Name}</div>
          <div class="info-caption">
            ${
              validArtists.length > 1
                ? `
              <span class="carousel-counter">
                ${currentIndex + 1} of ${validArtists.length} • 
              </span>
            `
                : ""
            }
          </div> 
        </div>
      </div>
    `;
}

// You'll need to define this fallbackImage variable
const fallbackImage = "path/to/fallback/image.jpg";
