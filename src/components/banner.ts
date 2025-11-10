import type { BannerProps } from "../models";

export function artistBanner(props: BannerProps): string {
  const {
    artistItem,
    labelName,
    titleName,
    trackCount,
    clickable = false,
    reloaded = false,
  } = props;

  const imageSrc = artistItem?.imageLg || "";
  const imageAlt = artistItem?.Name || "";
  const boxcss = reloaded ? "artist-outer reloaded" : "artist-outer";
  const infocss = reloaded ? "info-box reloaded" : "info-box";

  return `
  <div class="${boxcss} mb-2">
    <img src="${imageSrc}" alt="${imageAlt}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='"/>
  
    <div class="${infocss}">
      <div class="info-label">${escapeHtml(labelName)}</div>
      <div class="info-title">${escapeHtml(titleName)}</div>
      <div class="info-caption">${trackCount} tracks in your library</div>
      ${
        clickable
          ? `<button class="rounded-b-sm">Open in your library</button>`
          : ""
      }
    </div>
  </div> 
  `;
}

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
