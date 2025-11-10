const API_ENDPOINT = "https://u8m0btl997.execute-api.us-east-1.amazonaws.com";

const cache = new Map();
export function getDashOnce(url: string) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then((r) => r.json())
    );
  }
  return cache.get(url);
}

export const getDashboard = async () => {
  return getDashOnce(API_ENDPOINT + `/dash`);
};

export const getLibrary = async (page: number) => {
  const response = await fetch(API_ENDPOINT + `/request/ID/DESC/${page}/music`);
  return await response.json();
};

export const getArtistDetail = async (id: number) => {
  const response = await fetch(
    API_ENDPOINT + `/request/discNumber,trackNumber/ASC/1/artist/${id}`
  );
  return await response.json();
};

export const getAlbumDetail = async (id: number) => {
  const response = await fetch(
    API_ENDPOINT + `/request/albumFk,discNumber,trackNumber/ASC/1/album/${id}`
  );
  return await response.json();
};

export const getGenreDetail = async (id: string, page: number = 1) => {
  const response = await fetch(
    API_ENDPOINT + `/request/artistName/ASC/${page}/genre/${id}`
  );
  return await response.json();
};

export const getAlbumGrid = async (page: number = 1) => {
  const response = await fetch(
    API_ENDPOINT + `/request/Name/ASC/${page}/album`
  );
  return await response.json();
};

export const getArtistGrid = async (page: number = 1) => {
  const response = await fetch(
    API_ENDPOINT + `/request/Name/ASC/${page}/artist`
  );
  return await response.json();
};

export const getGenreGrid = async (page: number = 1) => {
  const response = await fetch(
    API_ENDPOINT + `/request/Genre/ASC/${page}/genre`
  );
  return await response.json();
};

export const getPlaylistGrid = async (page: number = 1) => {
  const response = await fetch(
    API_ENDPOINT + `/request/Title/ASC/${page}/playlist`
  );
  return await response.json();
};

export const getPlaylistDetail = async (id: string) => {
  const response = await fetch(
    API_ENDPOINT + `/request/trackNumber/DESC/1/playlist/${id}`
  );
  return await response.json();
};

export const getSearch = async (type: string, param: string) => {
  const response = await fetch(API_ENDPOINT + `/search/1/${type}/${param}`);
  return await response.json();
};

export const savePlaylist = async (json: any) => {
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  };
  const response = await fetch(`${API_ENDPOINT}/playlist`, requestOptions);
  return await response.json();
};
