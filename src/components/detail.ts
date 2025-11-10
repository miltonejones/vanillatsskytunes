import type { BannerProps, IState } from "../models";
import { artistBanner } from "./banner";
import { trackMenu } from "./menu";
import { pagination } from "./pager";
import { playlistMenu } from "./playlist";

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 1000 / 60);
  const remainingSeconds = Math.floor((seconds / 1000) % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

let previous: Partial<BannerProps> | undefined = undefined;

export function trackDetail(state: IState) {
  const reloaded =
    !!previous && previous.artistItem?.ID === state.banner?.artistItem.ID;
  previous = state.banner;
  const banner = !state.banner
    ? ""
    : artistBanner({ ...state.banner, reloaded });

  let html = ` <div>

  ${banner}
  ${pagination(state)}
  
  </div> `;

  // For album type: sort by track number, group by disc, remove duplicates
  if (state.view === "album") {
    // Remove duplicate tracks by track number within the same disc
    const uniqueTracks = state.displayedTracks.reduce((acc: any[], track) => {
      const existingTrack = acc.find(
        (t) =>
          t.discNumber === track.discNumber &&
          t.trackNumber === track.trackNumber
      );
      if (!existingTrack) {
        acc.push(track);
      }
      return acc;
    }, []);

    // Sort by disc number first, then by track number
    const sortedTracks = [...uniqueTracks].sort((a, b) => {
      const discA = a.discNumber || 1;
      const discB = b.discNumber || 1;

      if (discA !== discB) {
        return discA - discB;
      }

      const trackA = a.trackNumber || 0;
      const trackB = b.trackNumber || 0;
      return trackA - trackB;
    });

    // Group tracks by disc number
    const groupedByDisc = sortedTracks.reduce(
      (acc: { [key: number]: any[] }, track) => {
        const discNumber = track.discNumber || 1;
        if (!acc[discNumber]) {
          acc[discNumber] = [];
        }
        acc[discNumber].push(track);
        return acc;
      },
      {}
    );

    // Check if we have multiple discs
    const hasMultipleDiscs = Object.keys(groupedByDisc).length > 1;

    html += `<table class="track-list">`;
    html += `<tbody>`;

    Object.entries(groupedByDisc).forEach(([discNumber, discTracks]) => {
      // Disc header row - only show if multiple discs
      if (hasMultipleDiscs) {
        html += `
          <tr class="disc-header">
            <td colspan="7">Disc ${discNumber}</td>
          </tr>
        `;
      }

      // Track rows for this disc
      discTracks.forEach((track, index) => {
        const isCurrent = track.FileKey === state.currentSongId;

        html += `
          <tr class="track-row ${isCurrent ? "current" : ""}">
            <td class="icon-cell">
              <div class="track-info" data-track-id="${track.ID}">
                ${
                  track.albumImage
                    ? `<img src="${track.albumImage}" alt="${track.Title}" 
                       class="album-art ${
                         isCurrent ? "playing-animation" : ""
                       }" />`
                    : `<div class="album-art" style="background: #ddd;"></div>`
                }
              </div>
            </td>
            <td>
              <div class="track-info">
                <span class="track-number">${
                  track.trackNumber || index + 1
                }.</span>
                <span class="track-title" data-track-id="${track.ID}">${
          track.Title
        }</span>
                <div class="drawer-btn smaller" data-drawer-id="${track.ID}">${
          track.favorite ? "❤️" : "🖤"
        }</div>
              </div>
              <div class="track-details">
                <span class="artist-link link mobile" data-type="artist" data-id="${
                  track.artistFk
                }">${track.artistName}</span>
                -
                <span class="album-link link mobile" data-type="album" data-id="${
                  track.albumFk
                }">${track.albumName}</span>
              </div>
            </td>
            <td class="track-detail-column">
              <div class="track-meta link" data-type="artist" data-id="${
                track.artistFk
              }">${track.artistName}</div>
            </td>
            <td class="track-detail-column">
              <div class="track-meta link" data-type="album" data-id="${
                track.albumFk
              }">${track.albumName}</div>
            </td>
            <td class="track-detail-column">
              <div class="track-meta link" data-type="genre" data-id="${
                track.Genre
              }">${track.Genre}</div>
            </td>
            <td class="track-detail-column">
              <div class="track-meta">${formatTime(track.trackTime)}  </div>
            </td>
            <td class="track-detail-column">
              <div class="track-meta" data-list-id="${track.ID}">${
          track.favorite ? "❤️" : "🖤"
        }</div>
            </td>
            <td class="track-detail-column drawer-btn" data-drawer-id="${
              track.ID
            }">
                <i class="fa-solid fa-ellipsis"></i>
            </td>
          </tr>
        `;
      });
    });

    html += `</tbody>`;
    html += `</table>`;
  } else {
    // For non-album types: no sorting, no grouping, no track numbers
    html += `<table class="track-list">`;
    html += `<tbody>`;

    state.displayedTracks.forEach((track) => {
      const isCurrent = track.FileKey === state.currentSongId;

      html += `
        <tr class="track-row ${isCurrent ? "current" : ""}">
          <td class="icon-cell">
            <div class="track-info" data-track-id="${track.ID}">
              ${
                track.albumImage
                  ? `<img src="${track.albumImage}" alt="${track.Title}" 
                     class="album-art ${
                       isCurrent ? "playing-animation" : ""
                     }" />`
                  : `<div class="album-art" style="background: #ddd;"></div>`
              }
            </div>
          </td>
          <td>
            <div class="track-info text-truncate">
              <span class="track-title" data-track-id="${track.ID}">${
        track.Title
      }</span>
                <div class="drawer-btn smaller" data-drawer-id="${track.ID}">${
        track.favorite ? "❤️" : "🖤"
      }</div>
            </div>
            <div class="track-details">
              <span class="artist-link link text-truncate" data-type="artist" data-id="${
                track.artistFk
              }">${track.artistName}</span>
              -
              <span class="album-link link text-truncate" data-type="album" data-id="${
                track.albumFk
              }">${track.albumName}</span>
            </div>
          </td>
          <td class="track-detail-column">
            <div class="track-meta" data-type="artist" data-id="${
              track.artistFk
            }">${track.artistName}</div>
          </td>
          <td class="track-detail-column">
            <div class="track-meta" data-type="album" data-id="${
              track.albumFk
            }">${track.albumName}</div>
          </td>
          <td class="track-detail-column">
            <div class="track-meta" data-type="genre" data-id="${
              track.Genre
            }">${track.Genre}</div>
          </td>
          <td class="track-detail-column">
            <div class="track-meta">${formatTime(track.trackTime)}</div>
          </td>
            <td class="track-detail-column" data-list-id="${track.ID}">
              <div class="track-meta">${track.favorite ? "❤️" : "🖤"}</div>
            </td>
            <td class="track-detail-column drawer-btn" data-drawer-id="${
              track.ID
            }">
                <i class="fa-solid fa-ellipsis"></i>
            </td>
          
        </tr>
      `;
    });

    html += `</tbody>`;
    html += `</table>`;
  }

  html += trackMenu(state);
  html += playlistMenu(state);
  return html;
}
