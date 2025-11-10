import type { IPlaylistItem, IState, ITrackItem } from "./models";
import "./styles/style.css";
import "./styles/drawer.css";
import "./styles/audio-player.css";
import "./styles/carousel.css";
import { renderNavbar } from "./components";
import {
  AudioPlayer,
  CarouselController,
  SettingsController,
  URLController,
} from "./controllers";
import { SkytunesStore } from "./store";
import { artistGrid, dashBoard, playlistDetail, searchResults } from "./views";
import { BannerController } from "./controllers/bannerController";

export class SkytunesApp {
  store;
  initialized = false;
  urlController;
  carouselController;
  settingsController;
  bannerController;
  audioPlayer;
  innerView = "";
  innerId: string | undefined = undefined;

  constructor() {
    this.store = new SkytunesStore();
    this.urlController = new URLController(this.store);
    this.carouselController = new CarouselController(this.store);
    this.audioPlayer = new AudioPlayer(this.store);
    this.settingsController = new SettingsController(this.store);
    this.bannerController = new BannerController(this.store);
  }

  async init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.initializeApp());
    } else {
      await this.initializeApp();
    }
  }
  async initializeApp() {
    if (this.store) {
      this.store.subscribe((state: IState) => {
        this.render(state);
        this.urlController.updateURL(state); // Update URL when state changes
      });

      // Initialize URL controller
      this.urlController.init();

      await this.store.initializeApp();
      this.render(this.store.state);
      this.initialized = true;
      setTimeout(() => {
        this.bindEvents();
      }, 100);
      return;
    }
    alert("No store");
  }

  render(state: IState) {
    let content = "No content configured for this view - " + state.view;

    switch (state.view) {
      case "dash":
        content = dashBoard(state);
        break;
      case "album":
      case "artist":
      case "genre":
      case "playlist":
      case "library":
        content = playlistDetail(state);
        break;
      case "artists":
      case "genres":
      case "albums":
      case "playlists":
        content = artistGrid(state);
        break;
      case "search":
        content = searchResults(state);
        break;
      case "settings":
        return this.settingsController.render(state);
      default:
      // do nothing
    }
    console.log({ content });
    const nav = document.getElementById("nav");
    const app = document.getElementById("app");
    if (nav) {
      nav.innerHTML = renderNavbar(state);
    }
    if (app) {
      app.innerHTML = content;
    }
  }

  bindEvents() {
    document.addEventListener("click", this.handleClick.bind(this), true);
    document.addEventListener("input", this.handleInput.bind(this), true);
  }

  handleInput(e: Event) {
    console.log("handleInput");
    let target = e.target as HTMLInputElement;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleSearch = (param: string) => {
      this.store.searchByParam(param);
    };

    if (target.matches(".search-input") || target.closest(".search-input")) {
      e.preventDefault();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => handleSearch(target.value), 999);
      return;
    }
  }

  handleClick(e: MouseEvent) {
    console.log("handleClick");
    e.stopPropagation();

    let target = e.target as Element;

    if (
      target.matches("[data-queue-id]") ||
      target.closest("[data-queue-id]")
    ) {
      e.preventDefault();
      const viewElement = target.closest("[data-queue-id]");
      const ID = viewElement!.getAttribute("data-queue-id");
      const displayedTracks = this.store.state.displayedTracks;
      const track = displayedTracks?.find(
        (t: ITrackItem) => t.ID?.toString() === ID
      );
      if (track) {
        this.store.addToQueue(track);
      }
    }

    if (
      target.matches("[data-track-id]") ||
      target.closest("[data-track-id]")
    ) {
      e.preventDefault();
      const viewElement = target.closest("[data-track-id]");
      const ID = viewElement!.getAttribute("data-track-id");
      let displayedTracks =
        this.store.state.view === "search"
          ? this.store.state.searchResults?.music.records
          : this.store.state.displayedTracks;

      if (viewElement?.classList.contains("playlist-item")) {
        displayedTracks = this.store.state.songList;
      }

      const track = displayedTracks?.find(
        (t: ITrackItem) => t.ID?.toString() === ID
      );
      if (track) {
        this.store.setSongList(displayedTracks!, track);
      }

      return;
    }

    if (target.matches("[data-view]") || target.closest("[data-view]")) {
      e.preventDefault();
      const viewElement = target.closest("[data-view]");
      const view = viewElement!.getAttribute("data-view");
      const page = Number(viewElement!.getAttribute("data-page") || 1);
      this.urlController.handleViewChange(view!, page);
      return;
    }

    if (target.matches("[data-result]") || target.closest("[data-result]")) {
      e.preventDefault();

      const viewElement = target.closest("[data-result]");
      const type = viewElement!.getAttribute("data-result");

      document.querySelectorAll("[data-result]").forEach((el) => {
        el.classList.toggle("active", el.getAttribute("data-result") === type);
      });
      document.querySelectorAll(".result").forEach((el) => {
        el.classList.toggle(
          "show",
          el.getAttribute("data-result-type") === type
        );
      });
    }

    if (target.matches(".drawer-btn") || target.closest(".drawer-btn")) {
      e.preventDefault();

      const viewElement = target.closest(".drawer-btn");
      const id = viewElement!.getAttribute("data-drawer-id");
      const menuTrack = this.store.state.displayedTracks?.find(
        (t: ITrackItem) => t.ID?.toString() === id
      );

      this.store.setState({
        drawerOpen: !this.store.state.drawerOpen,
        menuTrack,
        right: true,
      });
    }
    if (target.matches("[data-add-id]") || target.closest("[data-add-id]")) {
      e.preventDefault();

      const viewElement = target.closest("[data-add-id]");
      const id = viewElement!.getAttribute("data-add-id");
      const menuList = this.store.state.playlistLib?.find(
        (t: IPlaylistItem) => t.listKey?.toString() === id
      );

      this.store.updateList(menuList!);
    }

    if (target.matches("[data-list-id]") || target.closest("[data-list-id]")) {
      e.preventDefault();

      const viewElement = target.closest("[data-list-id]");
      const id = viewElement!.getAttribute("data-list-id");
      const menuTrack = this.store.state.displayedTracks?.find(
        (t: ITrackItem) => t.ID?.toString() === id
      );

      console.log({ menuTrack, id });

      this.store.setState({
        listOpen: !this.store.state.listOpen,
        menuTrack,
      });
    }

    if (target.matches("[data-type]") || target.closest("[data-type]")) {
      e.preventDefault();
      const viewElement = target.closest("[data-type]");
      const type = viewElement!.getAttribute("data-type");
      const ID = viewElement!.getAttribute("data-id");
      const page = viewElement!.getAttribute("data-page") || "1";
      this.urlController.handleDetailChange(type!, ID!, page);

      return;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new SkytunesApp();
  app.init();
});
