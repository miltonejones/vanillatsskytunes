import { SkytunesStore } from "../store";

export class BannerController {
  private store: SkytunesStore;
  private artistId: number;
  constructor(store: SkytunesStore) {
    this.store = store;
    this.artistId = 0;
  }
}
