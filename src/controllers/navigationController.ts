// url-controller.ts
export class URLController {
  private store: any;
  private validViews = [
    "dash",
    "library",
    "artists",
    "albums",
    "genres",
    "playlists",
    "album",
    "artist",
    "genre",
    "playlist",
    "search",
  ];
  private isUpdatingFromURL = false;
  private isUpdatingFromState = false;

  constructor(store: any) {
    this.store = store;
  }

  // Parse URL without triggering state updates
  parseURL(): { view: string; detailId?: string; page?: number } {
    const hash = window.location.hash.substring(1);
    if (!hash) return { view: "dash" };

    const parts = hash.split("/");
    const view = parts[0];
    const detailId = parts[1];
    const page = parts[2] ? parseInt(parts[2]) : undefined;

    return {
      view: this.validViews.includes(view) ? view : "dash",
      detailId,
      page,
    };
  }

  // Handle URL changes and update state
  handleURLChange() {
    if (this.isUpdatingFromState) return;

    this.isUpdatingFromURL = true;
    const { view, detailId, page } = this.parseURL();

    // Only update state if something actually changed
    const currentState = this.store.state;
    if (currentState.view !== view || currentState.detailId !== detailId) {
      if (detailId) {
        this.handleDetailChange(view, detailId, page?.toString() || "1");
      } else {
        this.handleViewChange(view, page || 1);
      }
    }

    setTimeout(() => {
      this.isUpdatingFromURL = false;
    }, 0);
  }

  handleDetailChange(type: string, id: string, page: string = "1") {
    if (type === "album") {
      this.store.loadAlbum(Number(id));
    } else if (type === "artist") {
      this.store.loadArtist(Number(id));
    } else if (type === "genre") {
      this.store.loadGenre(id, Number(page));
    } else if (type === "playlist") {
      this.store.loadPlaylist(id);
    }
  }

  handleViewChange(view: string, page: number = 1) {
    switch (view) {
      case "library":
        this.store.loadLibrary(page);
        break;
      case "artists":
        this.store.loadArtists(page);
        break;
      case "playlists":
        this.store.loadPlaylists();
        break;
      case "albums":
        this.store.loadAlbums(page);
        break;
      case "genres":
        this.store.loadGenres(page);
        break;
      default:
        this.store.setState({ view });
    }
  }

  // Update URL when state changes
  updateURL(state: any) {
    if (this.isUpdatingFromURL) return;

    this.isUpdatingFromState = true;

    const newHash = [`#${state.view}`];
    if (state.detailId) {
      newHash.push(state.detailId);
    }
    if (state.page && state.page > 1) {
      newHash.push(state.page.toString());
    }

    const newURL = newHash.join("/");
    if (window.location.hash !== newURL) {
      window.location.hash = newURL;
    }

    setTimeout(() => {
      this.isUpdatingFromState = false;
    }, 0);
  }

  init() {
    window.addEventListener("hashchange", () => this.handleURLChange());

    // Initial URL check - don't trigger if it matches default state
    const urlState = this.parseURL();
    if (urlState.view !== "dash" || urlState.detailId) {
      this.handleURLChange();
    }
  }
}
