interface PreviousView {
  view: string;
  id: string;
}

export interface IState {
  loading: boolean;
  dashArtists: DashItem[];
  dashAlbums: DashItem[];
  view: string;
  type: string;
  currentSongId?: string;
  displayedTracks: ITrackItem[];
  songList: ITrackItem[];
  currentSong?: ITrackItem;
  announcerEnabled: boolean;
  chatType: string;
  chatName: string;
  chatZip: string;
  playlistGrid: IPlaylistItem[];
  playlistLib?: IPlaylistItem[];
  displayedGrid: IArtistDetail[];
  page: number;
  count: number;
  relatedPlaylists: string[];
  banner?: BannerProps;
  searchResults?: ISearchResult;
  searchParam?: string;
  drawerOpen?: boolean;
  listOpen?: boolean;
  right?: boolean;
  menuTrack?: ITrackItem;
  artists: DashItem[];
  detailId?: string;
  message?: string;
  toast?: boolean;
  previous?: PreviousView;
  songListOpen?: boolean;
}

export interface DashItem {
  Type: string;
  ID: number;
  Name: string;
  imageLg: string;
  Caption: string;
  Thumbnail: string;
}

export interface ITrackItem {
  ID?: number;
  Title: string;
  FileKey: string;
  albumImage: string | null;
  trackId: any;
  Genre: string;
  genreKey: any;
  albumFk?: any;
  albumArtistFk?: any;
  artistFk?: number;
  discNumber: number | null;
  trackTime: any;
  trackNumber: number | null;
  FileSize?: any;
  explicit: any;
  artistName: string;
  albumName: string;
  albumArtistName?: string;
  favorite?: boolean;
  queued?: boolean;
}

export interface IAlbumDetail {
  ID: number;
  Name: string;
  Thumbnail: string;
  artistFk: string;
  collectionId: number;
  artistName: string;
  TrackCount: number;
}

export interface IArtistDetail {
  ID: number;
  Name: string;
  Thumbnail: string;
  iArtistID: number;
  amgArtistID: number;
  imageLg: string;
  TrackCount: number;
  listKey?: string;
  Title?: string;
  image?: string;
  related?: string[];
  albumImage?: string;
  Genre?: string;
}

export interface BannerProps {
  artistItem: IArtistDetail;
  labelName: string;
  titleName: string;
  trackCount: number;
  clickable?: boolean;
  reloaded?: boolean;
}

export interface IMusicResponse {
  count: number;
  records: ITrackItem[];
}

export interface IAlbumDetailResponse {
  row: IAlbumDetail[];
  related: IMusicResponse;
}

export interface IArtistDetailResponse {
  row: IArtistDetail[];
  related: IMusicResponse;
}

export interface IArtistListResponse {
  count: number;
  records: IArtistDetail[];
}

export interface IAlbumListResponse {
  count: number;
  records: IAlbumDetail[];
}

export interface ISearchResult {
  album: IAlbumListResponse;
  artist: IArtistListResponse;
  music: IMusicResponse;
}

export interface IPlaylistItem {
  Title: string;
  listKey: string;
  related: string[];
  image: string;
  trackCount: string;
  selected: boolean;
  TrackCount: number;
  track: ITrackItem;
}

export interface IPlaylistResponse {
  count: number;
  records: IPlaylistItem[];
}

export interface IPlaylistDetailResponse {
  row: IPlaylistItem[];
  related: IMusicResponse;
}

export interface ItunesItem {
  wrapperType: string;
  kind: string;
  artistId: number;
  collectionId: number;
  trackId: number;
  artistName: string;
  collectionName: string;
  trackName: string;
  collectionCensoredName: string;
  trackCensoredName: string;
  artistViewUrl: string;
  collectionViewUrl: string;
  trackViewUrl: string;
  previewUrl: string;
  artworkUrl30: string;
  artworkUrl60: string;
  artworkUrl100: string;
  collectionPrice: number;
  trackPrice: number;
  releaseDate: string;
  collectionExplicitness: string;
  trackExplicitness: string;
  discCount: number;
  discNumber: number;
  trackCount: number;
  trackNumber: number;
  trackTimeMillis: number;
  country: string;
  currency: string;
  primaryGenreName: string;
  isStreamable: boolean;
}

export interface ItunesResponse {
  resultCount: number;
  results: [];
}

export interface IGenreDetail {
  ID: string;
  Genre: string;
  TrackCount: number;
  albumImage: string;
}

export interface IGenreResponse {
  row: IGenreDetail[];
  related: IMusicResponse;
}

export interface IGenreListResponse {
  count: number;
  records: IGenreDetail[];
}

export interface ICredential {
  username: string;
  password: string;
}

export interface ICrumbLink {
  url: string;
  label: string;
}

export interface ISortDetail {
  field: string;
  label: string;
}

export interface ICrumbList {
  title: string;
  links: ICrumbLink[];
}
