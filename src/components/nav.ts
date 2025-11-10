import type { IState } from "../models";

export function renderNavbar(state: IState): string {
  const navItems = [
    { name: "Home", path: "/", icon: "🏠", view: "dash" },
    { name: "Library", path: "/library", icon: "📚", view: "library" },
    { name: "Artists", path: "/artists", icon: "🤺", view: "artists" },
    { name: "Albums", path: "/albums", icon: "📀", view: "albums" },
    { name: "Genres", path: "/genres", icon: "🏷", view: "genres" },
    { name: "Playlists", path: "/playlists", icon: "📜", view: "playlists" },
  ];

  const isActiveLink = (view: string): boolean => {
    return state.view === view;
  };

  const navLinks = navItems
    .map(
      (item) => `
      <a href="#${item.view}" 
         data-view="${item.view}" 
         class="nav-link ${
           isActiveLink(item.view) ? "active fw-bold" : "text-light"
         }">
        ${item.icon} ${item.name}
      </a>
    `
    )
    .join("");

  // Also update the brand link
  return `
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container-fluid">
          <!-- Hamburger Menu Toggle -->
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
            <span class="navbar-toggler-icon"></span>
          </button>
  
          <!-- Brand -->
          <a class="navbar-brand d-flex align-items-center" href="#dash" data-view="dash">
            <div class="logo-dt me-2">
            <img src="https://www.sky-tunes.com/assets/icon-72x72.png" w alt="skytunes"/>
            </div>
            Skytunes
          </a>
  
          <!-- Search Box -->
          <div class="d-flex flex-grow-1 mx-lg-4 mx-2">
            <input 
              type="text" 
              placeholder="🎵 Search..." 
              class="form-control search-input"
            />
          </div>
  
          <!-- Navigation Links -->
          <div class="collapse navbar-collapse" id="navbarContent">
            <div class="navbar-nav">
              ${navLinks}
            </div>
          </div>
  
          <!-- Settings Icon -->
          <div class="d-flex align-items-center">
            <a href="#settings" data-view="settings" class="text-light fs-5">
              <i class="fas fa-cog"></i>
            </a>
          </div>
  
          <div class="logo-dt phone d-none d-lg-block"></div>
        </div>
      </nav>
  
      <!-- Offcanvas Drawer -->
      <div class="offcanvas offcanvas-start" tabindex="-1" id="offcanvasNavbar">
        <div class="offcanvas-header">
          <h5 class="offcanvas-title">Navigation</h5>
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div class="offcanvas-body">
          <ul class="list-group">
            ${navItems
              .map(
                (item) => `
              <li class="list-group-item ${
                isActiveLink(item.view) ? "active fw-bold" : ""
              }">
                <a href="#${item.view}" data-view="${
                  item.view
                }" class="text-decoration-none ${
                  isActiveLink(item.view) ? "text-white" : "text-dark"
                }">
                  ${item.icon} ${item.name}
                </a>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      </div>
    `;
}
