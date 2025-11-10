export function horizontalCard(
  image: string,
  title: string,
  caption: string,
  type: string,
  ID: string
) {
  return `<div class="card horiz m-1" 
            data-type="${type}"
            data-id="${ID}">
            <div class=" d-flex gap-1">
                <div class="horiz-photo">
                    <img src="${image}" alt="${title}"/>
                </div>
                <div class="horiz-content"> 
                    <div class="card-title text-truncate">
                        ${title}
                    </div>
                    <div class="card-subtitle text-muted">
                        ${caption}
                    </div>
                </div>
            </div>
        </div>`;
}
