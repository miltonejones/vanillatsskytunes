import type { IState } from "../models";
import { offsetDrawer } from "./drawer";
interface IMenuItem {
  label: string;
  caption?: string;
  icon: string;
  attributes: string;
}

export function trackMenu(state: IState) {
  const { drawerOpen, right, menuTrack: track } = state;

  const menuItems: IMenuItem[] = [
    {
      label: "View Artist",
      caption: track?.artistName,
      icon: "🤺",
      attributes: `data-type="artist" data-id="${track?.artistFk}"`,
    },
    {
      label: "View Album",
      caption: track?.albumName,
      icon: "📀",
      attributes: `data-type="album" data-id="${track?.albumFk}"`,
    },
    {
      label: "View Genre",
      caption: track?.Genre,
      icon: "🏷",
      attributes: `data-type="genre" data-id="${track?.Genre}"`,
    },
    {
      label: "Add to Queue",
      caption: "Play this song next",
      icon: "🎵",
      attributes: `data-queue-id="${track?.ID}"`,
    },
    {
      label: "Add to Playlist",
      caption: "Add this song to a playlist",
      icon: "➕",
      attributes: `data-list-id="${track?.ID}"`,
    },
  ];

  if (state.view === "playlist") {
    menuItems.push({
      label: "Update Playlist thumbnail",
      caption: "Set playlist thumbnail to this song artwork",
      icon: "🖼",
      attributes: ``,
    });
  }

  const menu = menuItems
    .map(
      (item) => `<div class="list-group-item drawer-btn" ${item.attributes}> 
                ${item.icon} ${item.label}
                <div class="text-muted fs-6">${item.caption}</div> 
              </div>`
    )
    .join("");

  const options = {
    open: drawerOpen,
    title: "Track actions",
    content: menu,
    key: "drawer",
    right: true,
  };

  return offsetDrawer(options);
}
