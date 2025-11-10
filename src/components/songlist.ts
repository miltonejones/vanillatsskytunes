import { IState } from "../models";
import { offsetDrawer } from "./drawer";

export function songDrawer(state: IState) {
  const { songList, currentSongId } = state;

  const menu = songList
    .map(
      (song) => `
        <div class="list-group-item playlist-item ${
          song.FileKey === currentSongId ? "active" : ""
        } ${song.queued ? "queued" : ""}" data-track-id="${song.ID}">
            <img src="${song.albumImage}" alt="${
        song.Title
      }" class="playlist-img ${
        song.FileKey === currentSongId ? "playing-animation" : ""
      }"/>
            <div class="playlist-content">
                <div class="playlist-title">
                    ${song.Title}
                </div>
                <div class="playlist-artist">
                    ${song.artistName}
                </div>
            </div>
        </div>
        `
    )
    .join("");

  const options = {
    open: state.songListOpen,
    title: "Playlist",
    content: menu,
    key: "song",
    attributes: `data-song-id="none"`,
    right: true,
  };

  return offsetDrawer(options);
}
