import { createCard } from "../components";
import type { IState } from "../models";

export function searchResults(state: IState) {
  const { searchResults } = state;
  let musicResults = `<div class="list-group">`;
  musicResults += searchResults?.music.records
    .map(
      (f) => `
        <div class="list-group-item d-flex gap-1 track-row ${
          f.FileKey === state.currentSongId ? "current" : ""
        }">
            <img class="album-art ${
              f.FileKey === state.currentSongId ? "playing-animation" : ""
            }" src="${f.albumImage}" alt="${f.Title}" />
           <div>
             <div class="track-title" data-track-id="${f.ID}">${f.Title}</div>
             <div class="d-flex gap-1">
                <div class="text-muted artist-link" data-type="album" data-id="${
                  f.albumFk
                }">${f.albumName}</div>
                -
                <div class="text-muted artist-link" data-type="artist" data-id="${
                  f.artistFk
                }">${f.artistName}</div>
            </div>
           </div>
        </div>
        `
    )
    .join("");
  musicResults += "</div>";

  let albumResults = `<div class="row">`;
  albumResults += searchResults?.album.records
    .map(
      (f) => `
        <div class="col-6 col-sm-6 col-md-4 col-lg-4 p-1">
            ${createCard({
              image: f.Thumbnail,
              title: f.Name,
              caption: f.TrackCount + " tracks",
              ID: f.ID.toString(),
              type: "album",
            })}
        </div>
        `
    )
    .join("");
  albumResults += "</div>";
  let artistResults = `<div class="row">`;
  artistResults += searchResults?.artist.records
    .map(
      (f) => `
        <div class="col-6 col-sm-6 col-md-4 col-lg-4 p-1">
            ${createCard({
              image: f.Thumbnail,
              title: f.Name,
              caption: f.TrackCount + " tracks",
              ID: f.ID.toString(),
              type: "artist",
            })}
        </div>
        `
    )
    .join("");
  artistResults += "</div>";

  let html = "";
  html += `
  <ul class="nav nav-tabs mobile-results"> 
    <li class="nav-item ">
        <a class="nav-link active" data-result="music" href="#">Music</a>
    </li>
    <li class="nav-item">
        <a class="nav-link" data-result="album" href="#">Albums</a>
    </li>
    <li class="nav-item">
        <a class="nav-link" data-result="artist" href="#">Artists</a>
    </li> 
    </ul>
  `;

  html += "<div class='desk-results row m-1'>";
  html += `
    <div class="col-12"><h4>Results for "${state.searchParam}"</h4></div>
    <div class="col-12 col-md-4 result show" data-result-type="music">
        <div class="row">
        <div class="col-12">Music results</div>
        ${musicResults}
        </div>
    </div>
    <div class="col-12 col-md-4 result" data-result-type="album">
        <div class="row">
        <div class="col-12">Album results</div>
        <div class="col-12">${albumResults}</div>
        
        </div>
    </div>
    <div class="col-12 col-md-4 result" data-result-type="artist">
        <div class="row">
        <div class="col-12">Artist results</div>
        <div class="col-12">${artistResults}</div>
        
        </div>
    </div>
    `;
  html += "</div>";

  return html;
}
