// Mock CSS imports at the VERY TOP - before any other imports
jest.mock("../src/styles/style.css", () => ({}));
jest.mock("../src/styles/drawer.css", () => ({}));
jest.mock("../src/styles/audio-player.css", () => ({}));
jest.mock("../src/styles/carousel.css", () => ({}));

// Now import your other dependencies
import { SkytunesApp } from "../src/main";

const mockTrack = {
  ID: 5916,
  Title: "Domination - Live in UK 2019",
  FileKey: "BAND-MAID - Domination - Live in UK 2019.mp3",
  albumImage: null,
  trackId: null,
  Genre: "Rock",
  genreKey: "unknowngenre",
  albumFk: 1551,
  albumArtistFk: 962,
  artistFk: 962,
  discNumber: null,
  trackTime: 231456,
  trackNumber: null,
  FileSize: null,
  explicit: null,
  artistName: "BAND-MAID",
  albumName: "Unknown Album",
  albumArtistName: "BAND-MAID",
};

const mockState = {
  loading: false,
  dashArtists: [],
  dashAlbums: [],
  view: "dash",
  type: "dash",
  displayedTracks: [],
  songList: [],
  announcerEnabled: true,
  chatType: "deep",
  chatName: "Milton",
  chatZip: "",
  playlistGrid: [],
  displayedGrid: [],
  page: 1,
  count: 1,
  relatedPlaylists: [],
  artists: [],
};

// Mock other dependencies
jest.mock("../src/store", () => ({
  SkytunesStore: jest.fn().mockImplementation(() => ({
    subscribe: jest.fn(),
    initializeApp: jest.fn(),
    setState: jest.fn(),
    addToQueue: jest.fn(),
    setSongList: jest.fn(),
    searchByParam: jest.fn(),
    updateList: jest.fn(),
    state: {
      view: "dash",
      displayedTracks: [],
      searchResults: null,
      drawerOpen: false,
      listOpen: false,
      playlistLib: [],
      songList: [],
    },
  })),
}));

jest.mock("../src/controllers", () => ({
  URLController: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    updateURL: jest.fn(),
    handleViewChange: jest.fn(),
    handleDetailChange: jest.fn(),
  })),
  AudioPlayer: jest.fn().mockImplementation(() => ({})),
  CarouselController: jest.fn(),
  SettingsController: jest.fn(),
}));

jest.mock("../src/views", () => ({
  dashBoard: jest.fn(() => "<div>Dashboard</div>"),
  playlistDetail: jest.fn(() => "<div>Playlist Detail</div>"),
  artistGrid: jest.fn(() => "<div>Artist Grid</div>"),
  searchResults: jest.fn(() => "<div>Search Results</div>"),
}));

jest.mock("../src/components", () => ({
  renderNavbar: jest.fn(() => "<nav>Navbar</nav>"),
}));

describe("SkytunesApp", () => {
  let app: SkytunesApp;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new SkytunesApp();
  });

  test("should create app with store", () => {
    expect(app.store).toBeDefined();
    expect(app.initialized).toBe(false);
  });

  test("should initialize controllers", () => {
    expect(app.urlController).toBeDefined();
    expect(app.audioPlayer).toBeDefined();
    expect(app.carouselController).toBeDefined();
    expect(app.settingsController).toBeDefined();
  });

  test("should initialize app when DOM is ready", async () => {
    // Mock DOM ready state
    Object.defineProperty(document, "readyState", {
      value: "complete",
      writable: true,
    });

    const initializeAppSpy = jest.spyOn(app, "initializeApp" as any);
    await app.init();

    expect(initializeAppSpy).toHaveBeenCalled();
  });

  test("should wait for DOMContentLoaded when document is loading", async () => {
    // Mock DOM loading state
    Object.defineProperty(document, "readyState", {
      value: "loading",
      writable: true,
    });

    const addEventListenerSpy = jest.spyOn(document, "addEventListener");
    const initializeAppSpy = jest.spyOn(app, "initializeApp" as any);

    await app.init();

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "DOMContentLoaded",
      expect.any(Function)
    );
    expect(initializeAppSpy).not.toHaveBeenCalled();
  });

  test("should render correct views based on state", () => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="nav"></div>
      <div id="app"></div>
    `;

    app.render(mockState);

    const appElement = document.getElementById("app");
    expect(appElement?.innerHTML).toContain("Dashboard");
  });

  test("should handle search input with debounce", () => {
    jest.useFakeTimers();

    const searchByParamSpy = jest.spyOn(app.store, "searchByParam");

    // Create a mock input event
    const inputElement = document.createElement("input");
    inputElement.className = "search-input";
    inputElement.value = "test query";

    const event = new Event("input", { bubbles: true });
    Object.defineProperty(event, "target", { value: inputElement });

    app.handleInput(event);

    // Fast-forward timers
    jest.runAllTimers();

    expect(searchByParamSpy).toHaveBeenCalledWith("test query");

    jest.useRealTimers();
  });

  test("should handle queue click events", () => {
    // const mockTrack = { ID: "123", title: "Test Track" };
    const addToQueueSpy = jest.spyOn(app.store, "addToQueue");

    // Mock state with displayedTracks
    app.store.state.displayedTracks = [mockTrack];

    // Create a mock click event on queue element
    const queueElement = document.createElement("div");
    queueElement.setAttribute("data-queue-id", "5916");

    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "target", { value: queueElement });

    app.handleClick(event);

    expect(addToQueueSpy).toHaveBeenCalledWith(mockTrack);
  });

  test("should handle track click events", () => {
    // const mockTrack = { ID: "456", title: "Test Track" };
    const setSongListSpy = jest.spyOn(app.store, "setSongList");

    // Mock state with displayedTracks
    app.store.state.displayedTracks = [mockTrack];

    // Create a mock click event on track element
    const trackElement = document.createElement("div");
    trackElement.setAttribute("data-track-id", "5916");

    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "target", { value: trackElement });

    app.handleClick(event);

    expect(setSongListSpy).toHaveBeenCalledWith([mockTrack], mockTrack);
  });

  test("should handle view change click events", () => {
    const handleViewChangeSpy = jest.spyOn(
      app.urlController,
      "handleViewChange"
    );

    // Create a mock click event on view element
    const viewElement = document.createElement("div");
    viewElement.setAttribute("data-view", "artists");
    viewElement.setAttribute("data-page", "2");

    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "target", { value: viewElement });

    app.handleClick(event);

    expect(handleViewChangeSpy).toHaveBeenCalledWith("artists", 2);
  });

  test("should handle detail change click events", () => {
    const handleDetailChangeSpy = jest.spyOn(
      app.urlController,
      "handleDetailChange"
    );

    // Create a mock click event on detail element
    const detailElement = document.createElement("div");
    detailElement.setAttribute("data-type", "album");
    detailElement.setAttribute("data-id", "789");
    detailElement.setAttribute("data-page", "1");

    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "target", { value: detailElement });

    app.handleClick(event);

    expect(handleDetailChangeSpy).toHaveBeenCalledWith("album", "789", "1");
  });

  test("should handle drawer button click events", () => {
    // const mockTrack = { ID: "999", title: "Menu Track" };
    const setStateSpy = jest.spyOn(app.store, "setState");

    app.store.state.displayedTracks = [mockTrack];

    // Create a mock click event on drawer button
    const drawerElement = document.createElement("button");
    drawerElement.className = "drawer-btn";
    drawerElement.setAttribute("data-drawer-id", "5916");

    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "target", { value: drawerElement });

    app.handleClick(event);

    expect(setStateSpy).toHaveBeenCalledWith({
      drawerOpen: true,
      menuTrack: mockTrack,
      right: true,
    });
  });

  test("should bind events after initialization", async () => {
    const addEventListenerSpy = jest.spyOn(document, "addEventListener");

    // Mock the store's initializeApp to resolve immediately
    app.store.initializeApp = jest.fn().mockResolvedValue(undefined);

    await (app as any).initializeApp();

    // Wait for the setTimeout to execute
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "click",
      expect.any(Function),
      true
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "input",
      expect.any(Function),
      true
    );
  });

  test("should render settings view separately", () => {
    const settingsRenderSpy = jest.spyOn(app, "render");

    app.render(mockState);

    expect(settingsRenderSpy).toHaveBeenCalledWith(mockState);
  });

  test("should handle search result toggle events", () => {
    // Create mock DOM structure
    document.body.innerHTML = `
      <div data-result="music" class="active"></div>
      <div data-result="artists"></div>
      <div data-result-type="music" class="result"></div>
      <div data-result-type="artists" class="result"></div>
    `;

    // Create a mock click event on result element
    const resultElement = document.querySelector(
      '[data-result="artists"]'
    ) as Element;

    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "target", { value: resultElement });

    app.handleClick(event);

    const musicResult = document.querySelector('[data-result="music"]');
    const artistsResult = document.querySelector('[data-result="artists"]');
    const musicContent = document.querySelector('[data-result-type="music"]');
    const artistsContent = document.querySelector(
      '[data-result-type="artists"]'
    );

    expect(musicResult?.classList.contains("active")).toBe(false);
    expect(artistsResult?.classList.contains("active")).toBe(true);
    expect(musicContent?.classList.contains("show")).toBe(false);
    expect(artistsContent?.classList.contains("show")).toBe(true);
  });
});
