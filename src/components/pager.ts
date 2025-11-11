import type { IState } from "../models";

export function pagination(state: IState) {
  let html = "";
  const pageCount = Math.ceil(state.count / 100);

  const attributes =
    state.view !== "genre"
      ? `data-view="${state.view}"`
      : `data-type="${state.view}" data-id="${state.detailId}"`;

  if (pageCount > 1) {
    // Pagination controls
    html += `
        <div class="d-flex align-items-center  justify-content-center mb-3 gap-1">
          <button class="btn btn-light btn-sm page-num" ${
            state.page === 0 ? "disabled" : ""
          }  data-page="${Number(state.page) - 1}"
             ${attributes} >
            <i class="fa-solid fa-chevron-left"></i> Previous
          </button>
          <span class="text-muted">
            Page ${state.page} of ${pageCount}
          </span>
          <button class="btn btn-light btn-sm page-num" ${
            state.page + 1 > pageCount ? "disabled" : ""
          }  data-page="${Number(state.page) + 1}" 
             ${attributes} >
            Next <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      `;
  }

  return html;
}
