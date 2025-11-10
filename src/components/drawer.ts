interface offsetDrawerProps {
  open: boolean | undefined;
  title: string;
  content: string;
  key: string;
  right?: boolean;
  attributes?: string;
}

export function offsetDrawer(options: offsetDrawerProps): string {
  const { open, title, right, content, attributes, key } = options;

  const css = `${open ? "menu-drawer open " : "menu-drawer"} ${
    right ? "right" : "left"
  }`;
  let html = `
    <div class="${css}" >
        <nav class="bg-gray-600 p-2 shadow-md">
            <div class="container mx-auto d-flex items-center justify-between">
                <div class="text-white text-lg font-bold flex align-middle"> 
                <div>
                    <b>Skytunes</b>
                    <div class="text-xs">${title}</div>
                </div>
                </div>
                <div class="spacer"></div>
                <div class="${key}-btn" ${attributes}>❌</div>
            </div>
        </nav>


        <div class="list-group">
            ${content}
        </div>
    </div>

`;

  if (open) {
    html += `<div class="drawer-backdrop ${key}-btn" ${attributes}></div>`;
  }
  return html;
}
