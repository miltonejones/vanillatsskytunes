import type { DashItem } from "../models";

export class CarouselController {
  private store: any;
  private validArtists: DashItem[] = [];
  private currentCarouselIndex = 0;
  private carouselInterval: number | null = null;

  constructor(store: any) {
    this.store = store;
    this.store.subscribe(this.handleStoreChange.bind(this));
    console.log("CarouselController initialized successfully");
  }

  handleStoreChange() {
    if (this.store.state.view === "dash") {
      this.initializeApp();
    } else {
      this.destroyCarousel();
    }
  }

  initializeApp() {
    // Clear any existing interval first
    this.destroyCarousel();

    this.currentCarouselIndex = 0;
    this.validArtists = this.store.state.dashArtists.filter(
      (artist: DashItem) => artist.imageLg
    );

    this.setupEventListeners();

    if (this.validArtists.length > 1) {
      this.carouselInterval = window.setInterval(() => {
        this.handleCarouselNext();
      }, 5000);
    }
  }

  destroyCarousel() {
    // Clear the interval
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }

    // Remove event listeners
    document
      .querySelector(".carousel-arrow-prev")
      ?.removeEventListener("click", this.handleCarouselPrev.bind(this));
    document
      .querySelector(".carousel-arrow-next")
      ?.removeEventListener("click", this.handleCarouselNext.bind(this));

    document.querySelectorAll(".indicator").forEach((indicator, index) => {
      indicator.removeEventListener("click", () => this.goToSlide(index));
    });
  }

  setupEventListeners() {
    // Remove existing listeners first to prevent duplicates
    this.destroyCarousel();

    // Add new listeners
    document
      .querySelector(".carousel-arrow-prev")
      ?.addEventListener("click", this.handleCarouselPrev.bind(this));
    document
      .querySelector(".carousel-arrow-next")
      ?.addEventListener("click", this.handleCarouselNext.bind(this));

    // Add indicator listeners
    document.querySelectorAll(".indicator").forEach((indicator, index) => {
      indicator.addEventListener("click", () => this.goToSlide(index));
    });
  }

  handleCarouselNext() {
    const nextIndex =
      this.currentCarouselIndex === this.validArtists.length - 1
        ? 0
        : this.currentCarouselIndex + 1;
    this.transitionToSlide(nextIndex, "next");
  }

  handleCarouselPrev() {
    const prevIndex =
      this.currentCarouselIndex === 0
        ? this.validArtists.length - 1
        : this.currentCarouselIndex - 1;
    this.transitionToSlide(prevIndex, "prev");
  }

  goToSlide(index: number) {
    if (index === this.currentCarouselIndex) return;
    const direction = index > this.currentCarouselIndex ? "next" : "prev";
    this.transitionToSlide(index, direction);
  }

  transitionToSlide(targetIndex: number, direction: "next" | "prev") {
    const container = document.querySelector(".carousel-container");
    if (!container) return;

    // Add transition class
    container.classList.add(direction);

    // Create and add the target slide (the one we're transitioning TO)
    const targetArtist = this.validArtists[targetIndex];
    const targetSlide = document.createElement("img");
    targetSlide.src = targetArtist.imageLg;
    targetSlide.alt = targetArtist.Name;
    targetSlide.className = `carousel-slide ${direction}`;
    targetSlide.dataset.type = "artist";
    targetSlide.dataset.id = targetArtist.ID.toString();
    targetSlide.onerror = function () {
      this.src = fallbackImage;
    };
    container.appendChild(targetSlide);

    setTimeout(() => {
      this.currentCarouselIndex = targetIndex;
      this.updateCarousel();
      container.classList.remove(direction);
    }, 800);
  }

  updateCarousel() {
    const currentArtist = this.validArtists[this.currentCarouselIndex];
    const container = document.querySelector(".carousel-container");
    if (!container) return;

    const title = document.querySelector(".info-title");
    const counter = document.querySelector(".carousel-counter");

    // Update image - keep only the active slide
    const newImg = document.createElement("img");
    newImg.src = currentArtist.imageLg;
    newImg.alt = currentArtist.Name;
    newImg.className = "carousel-slide active";
    newImg.dataset.type = "artist";
    newImg.dataset.id = currentArtist.ID.toString();
    newImg.onerror = function () {
      this.src = fallbackImage;
    };

    container.innerHTML = "";
    container.appendChild(newImg);

    // Update text content
    if (title) title.textContent = currentArtist.Name;
    if (counter) {
      counter.textContent =
        this.currentCarouselIndex +
        1 +
        " of " +
        this.validArtists.length +
        " • ";
    }

    // Update indicators
    document.querySelectorAll(".indicator").forEach((el, index) => {
      if (index === this.currentCarouselIndex) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  }
}

// if (!window.carouselController) {
//   (window as any).carouselController = new CarouselController();
// }
// You'll need to define this fallbackImage variable
const fallbackImage = "path/to/fallback/image.jpg";
