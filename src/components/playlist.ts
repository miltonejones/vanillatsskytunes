import type { IPlaylistItem, IState, ITrackItem } from "../models";
import { offsetDrawer } from "./drawer";

export function playlistMenu(state: IState) {
  const { listOpen, playlistLib, menuTrack: track } = state;

  const matchList = (list: IPlaylistItem, track: ITrackItem) => {
    return list.related && list.related.includes(track?.FileKey) ? true : false;
  };

  console.log({ track });

  const menu =
    playlistLib
      ?.map(
        (
          item
        ) => `<div class="list-group-item list-btn d-flex justify-content-between" data-add-id="${
          item.listKey
        }" > 
                  ${item.Title} <div>${
          matchList(item, track!) ? "❤️" : "🖤"
        }</div>
              </div>`
      )
      .join("") || "";

  const options = {
    open: listOpen,
    title: "Add track to playlist",
    content: menu,
    key: "list",
    attributes: `data-list-id="none"`,
  };

  return offsetDrawer(options);
}
