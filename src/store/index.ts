// store.ts
import { artistBanner } from "../components";
import {
  getAlbumDetail,
  getAlbumGrid,
  getArtistDetail,
  getArtistGrid,
  getDashboard,
  getGenreDetail,
  getGenreGrid,
  getLibrary,
  getPlaylistDetail,
  getPlaylistGrid,
  getSearch,
  savePlaylist,
} from "../connector";
import { ToastController } from "../controllers/toastController";
import type {
  BannerProps,
  DashItem,
  IPlaylistItem,
  IState,
  ITrackItem,
} from "../models";

export class SkytunesStore {
  state: IState;
  listeners: any[];
  private previousState: Partial<IState>;
  toastController;

  constructor() {
    this.state = {
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
    this.listeners = [];
    this.previousState = {};
    this.toastController = new ToastController();
  }

  subscribe(listener: any) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    if (this.hasStateChanged()) {
      this.listeners.forEach((listener) => listener(this.state));
      this.previousState = { ...this.state };
    }
  }

  private hasStateChanged(): boolean {
    const keys = Object.keys(this.state) as (keyof IState)[];
    return keys.some((key) => {
      const current = this.state[key];
      const previous = this.previousState[key];

      if (Array.isArray(current) && Array.isArray(previous)) {
        return (
          current.length !== previous.length ||
          current.some((item, index) => item !== previous[index])
        );
      }

      return current !== previous;
    });
  }

  setState(updates: any) {
    // Only update if something actually changes
    const hasChanges = Object.keys(updates).some((key) => {
      const stateKey = key as keyof IState;
      return this.state[stateKey] !== updates[stateKey];
    });

    if (hasChanges) {
      this.state = {
        ...this.state,
        ...updates,
        previous: {
          view: this.state.view,
          id: this.state.detailId,
        },
      };
      this.notify();
    }
  }

  setSongList(songs: ITrackItem[], song?: ITrackItem) {
    this.setState({
      songList: songs,
      currentSong: song || null,
      currentSongId: song?.FileKey || null,
    });
  }

  advanceTrack(direction: number) {
    const keys = this.state.songList.map((song) => song.FileKey);
    const index = keys.indexOf(this.state.currentSongId!);
    const nextIndex = index + direction;

    if (nextIndex >= 0 && nextIndex < this.state.songList.length) {
      const song = this.state.songList[nextIndex];
      this.setState({
        currentSong: song,
        currentSongId: song?.FileKey,
      });
    }
  }

  setChatTypeValue(chatType: string) {
    this.setState({ chatType });
  }

  setAnnouncerEnabledValue(enabled: boolean) {
    this.setState({ announcerEnabled: enabled });
  }

  addToQueue(track: ITrackItem) {
    const keys = this.state.songList.map((song) => song.FileKey);
    const index = keys.indexOf(this.state.currentSongId!);

    // Add queued property to the track
    const queuedTrack = {
      ...track,
      queued: true,
    };

    const newSongList = [...this.state.songList];
    let insertIndex = index + 1;

    // Look for the last track with queued property
    for (let i = this.state.songList.length - 1; i > index; i--) {
      if (this.state.songList[i].queued) {
        insertIndex = i + 1;
        break;
      }
    }
    newSongList.splice(insertIndex, 0, queuedTrack);
    this.setState({ songList: newSongList });

    this.toastController.alert(`"${track.Title}" added to queue`, "Success!");
  }

  async searchByParam(searchParam: string) {
    const searchResults = {
      music: await getSearch("music", searchParam),
      artist: await getSearch("artist", searchParam),
      album: await getSearch("album", searchParam),
    };
    this.setState({ searchResults, searchParam, view: "search" });
  }

  async loadBanner(titleName: string = "", trackCount: number) {
    const artistNode = this.state.displayedTracks.find((f) => !!f.artistFk);
    if (!artistNode?.artistFk) return;
    const res = await getArtistDetail(artistNode.artistFk);
    if (!(res && res.row)) {
      return this.setState({ banner: null });
    }
    const [row] = res.row;
    const banner: BannerProps = {
      artistItem: row,
      labelName: this.state.view,
      titleName: titleName || row.Name,
      trackCount,
    };
    this.setState({ banner });
    this.render();
  }

  render() {
    const art = document.getElementById("art");
    const { banner } = this.state;
    if (!art) return;
    if (!banner) art.innerHTML = "";
    art.innerHTML = artistBanner(banner!);
  }

  // Original methods
  async loadAlbum(id: number) {
    const res = await getAlbumDetail(id);
    const [row] = res.row;
    this.setState({
      displayedTracks: res.related.records.map((t: ITrackItem) =>
        this.matchTrack(t)
      ),
      view: "album",
      type: "detail",
      count: 0,
      detailId: id,
      page: 0,
    });
    this.loadBanner(row.Name, res.related.count);
  }

  async loadArtist(id: number) {
    const res = await getArtistDetail(id);
    const [row] = res.row;
    this.setState({
      displayedTracks: res.related.records.map((t: ITrackItem) =>
        this.matchTrack(t)
      ),
      view: "artist",
      type: "detail",
      count: 0,
      detailId: id,
      page: 0,
    });
    this.loadBanner(row.Name, res.related.count);
  }

  async loadArtists(page: number) {
    const res = await getArtistGrid(page);
    this.setState({
      displayedGrid: res.records,
      view: "artists",
      type: "artist",
      page,
      count: res.count,
      detailId: undefined,
    });
  }

  async loadAlbums(page: number) {
    const res = await getAlbumGrid(page);
    this.setState({
      displayedGrid: res.records,
      view: "albums",
      type: "album",
      page,
      count: res.count,
      detailId: undefined,
    });
  }

  async loadPlaylists() {
    const res = await getPlaylistGrid();
    this.setState({
      displayedGrid: res.records,
      view: "playlists",
      type: "playlist",
      count: res.count,
      detailId: undefined,
      page: 0,
    });
  }

  async loadGenres(page: number) {
    const res = await getGenreGrid(page);
    this.setState({
      displayedGrid: res.records,
      view: "genres",
      type: "genre",
      page,
      count: res.count,
      detailId: undefined,
    });
  }

  async loadLibrary(page: number = 1) {
    const res = await getLibrary(page);
    this.setState({
      displayedTracks: res.records.map((t: ITrackItem) => this.matchTrack(t)),
      view: "library",
      type: "",
      page,
      count: res.count,
      detailId: undefined,
    });
    this.loadBanner("", res.count);
  }

  async loadGenre(genre: string, page: number = 1) {
    const res = await getGenreDetail(genre.replace("/", "*"), page);
    this.setState({
      displayedTracks: res.related.records.map((t: ITrackItem) =>
        this.matchTrack(t)
      ),
      view: "genre",
      type: "detail",
      count: res.related.count,
      page,
      detailId: genre,
    });
    this.loadBanner(genre, res.related.count);
  }

  async loadPlaylist(key: string) {
    const res = await getPlaylistDetail(key);
    const [row] = res.row;
    this.setState({
      displayedTracks: res.related.records.map((t: ITrackItem) =>
        this.matchTrack(t)
      ),
      view: "playlist",
      type: "detail",
      count: 0,
      detailId: key,
      page: 0,
    });
    this.loadBanner(row.Title, res.related.count);
  }

  async loadDash() {
    const data = await getDashboard();
    const lists = await getPlaylistGrid();

    const dashArtists = data
      .filter((f: DashItem) => f.Type === "artist" && !!f.Caption)
      .sort(() => Math.random() - 0.5)
      .slice(0, 12);

    const dashAlbums = data
      .filter((f: DashItem) => f.Type === "album" && !!f.Caption)
      .sort(() => Math.random() - 0.5)
      .slice(0, 12);

    const playlistGrid = lists.records
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);

    this.setState({
      dashAlbums,
      dashArtists,
      playlistGrid,
      playlistLib: lists.records,
    });
    this.extractRelated(lists.records);
  }

  async updateList(playlist: IPlaylistItem) {
    const { menuTrack: currentTrack } = this.state;
    const { related } = playlist;
    const fileKey = currentTrack?.FileKey;
    const updated = {
      ...playlist,
      related:
        related.indexOf(fileKey!) > -1
          ? related.filter((f) => f !== fileKey!)
          : related.concat(fileKey!),
    };
    await savePlaylist(updated);
    this.setState({
      listOpen: false,
    });
    this.rematch();
    this.toastController.alert(
      `"${currentTrack?.Title}" added to playlist "${playlist.Title}"`,
      "Success!"
    );
  }

  matchTrack(track: ITrackItem) {
    const updated = {
      ...track,
      favorite:
        this.state.relatedPlaylists.indexOf(track?.FileKey) > -1 ? true : false,
    };
    return updated;
  }

  async rematch() {
    const lists = await getPlaylistGrid();
    this.setState({
      playlistLib: lists.records,
    });
    this.extractRelated(lists.records);
    this.setState({
      displayedTracks: this.state.displayedTracks.map((t: ITrackItem) =>
        this.matchTrack(t)
      ),
    });
  }

  extractRelated(records: IPlaylistItem[]) {
    const relatedPlaylists: string[] = [];
    if (!records) return relatedPlaylists;
    records.forEach((item) => {
      if (item.related && Array.isArray(item.related)) {
        relatedPlaylists.push(...item.related);
      }
    });
    this.setState({ relatedPlaylists });
  }

  async initializeApp() {
    this.loadDash();
  }
}
