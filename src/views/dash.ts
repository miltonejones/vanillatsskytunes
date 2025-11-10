import { createCard, ArtistCarousel, horizontalCard } from "../components";
import type { IState } from "../models";

const createKey = (name: string) => name.replace(/[\s&-]/g, "").toLowerCase();
export function dashBoard(state: IState) {
  let html = "";
  html += ArtistCarousel(state);
  html += `<div class="container-fluid"><div class="row"><h4>📜 Featured playlists</h4></div><div class="row mb-1">`;
  html += state.playlistGrid
    .map(
      (f) =>
        `<div class="col-6 col-sm-6 col-md-4 col-lg-3">${horizontalCard(
          f.image,
          f.Title,
          f.related.length + " tracks",
          "playlist",
          f.listKey || createKey(f.Title)
        )}</div>`
    )
    .join("");
  html += "</div>";

  html += `<div class="row"><h4>📀 Featured albums</h4></div><div class="row mb-1">`;
  html += state.dashAlbums
    .map(
      (item) =>
        `<div class="col-6 col-sm-6 col-md-4 col-lg-2 p-1">${createCard({
          image: item.Thumbnail,
          title: item.Name,
          caption: item.Caption,
          type: "album",
          ID: item.ID.toString(),
        })}</div>`
    )
    .join("");
  html += `</div>`;

  html += `<div class="row">`;
  html += `<h4>🤺 Featured artists</h4>`;
  html += state.dashArtists
    .map(
      (item) =>
        `<div class="col-6 col-sm-6 col-md-4 col-lg-2 p-1">${createCard({
          image: item.Thumbnail,
          title: item.Name,
          caption: item.Caption,
          type: "artist",
          ID: item.ID.toString(),
        })}</div>`
    )
    .join("");
  html += `</div>`;
  html += `</div>`;

  return html;
}
