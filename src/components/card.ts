export function createCard(options: {
  image: string;
  title: string;
  caption: string;
  ID: string;
  type: string;
}): string {
  const { image, title, caption, ID, type } = options;

  const fallbackImage =
    "https://www.sky-tunes.com/assets/default_album_cover.jpg";
  const finalImage = image || fallbackImage;

  return `
      <button 
        type="button"
        data-type="${type}"
        data-id="${ID}"
        aria-label="${title}"
        class="card grid-card btn btn-link p-0 text-start text-decoration-none 
        style="border: none; background: none;"
      >
        <div class="card border-0 shadow-sm hover-shadow grid-card" style="width:100%">
          <div class="ratio ratio-1x1 bg-light">
            <img 
               src="${finalImage}" 
                alt="${title}"
                class="card-img-top object-fit-cover h-100 w-100"
                style="transition: transform 0.3s ease;"
                onerror="this.src='${fallbackImage}'"
            />
          </div>
          <div class="card-body p-2">
            <h6 class="card-title text-truncate mb-0 text-dark">${title}</h6>
            <p class="card-text text-truncate text-muted small mb-0">${caption}</p>
          </div>
        </div>
      </button>
    `;
}

//   // Add this CSS to your stylesheet for hover effects
//   const cardStyles = `
//   <style>
//   .card.hover-shadow {
//     transition: all 0.2s ease-in-out, transform 0.2s ease-in-out;
//   }

//   .card.hover-shadow:hover {
//     transform: translateY(-2px);
//     box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
//   }

//   .card.hover-shadow img {
//     transition: transform 0.3s ease;
//   }

//   .card.hover-shadow:hover img {
//     transform: scale(1.05);
//   }
//   </style>
//   `;

//   // Usage example:
//   // const cardHtml = createCard({
//   //   image: "https://example.com/image.jpg",
//   //   title: "Card Title",
//   //   caption: "Card description",
//   //   onClick: "handleCardClick()",
//   //   alt: "Image description",
//   //   className: "my-custom-class"
//   // });
