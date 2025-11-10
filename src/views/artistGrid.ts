import { createCard, pagination } from "../components";
import type { IState } from "../models";

export function artistGrid(state: IState) {
  let htm = `<div class="row">
    
  ${pagination(state)}
  
  </div><div class="row m-1">`;

  htm += state.displayedGrid
    .map(
      (item) =>
        `<div class="col-6 col-sm-6 col-md-4 col-lg-2 p-1">${createCard({
          title: item.Genre || item.Title || item.Name,
          image: item.albumImage || item.image || item.Thumbnail,
          type: state.type,
          caption: item.TrackCount + " tracks",
          ID: item.listKey || item.ID?.toString(),
        })}</div>`
    )
    .join("");
  htm += `</div>`;
  return htm;
}
