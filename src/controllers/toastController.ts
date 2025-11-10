export interface ToastState {
  message: string;
  shown: boolean;
}

export class ToastController {
  constructor() {}

  alert(message: string, title: string = "Skytunes", caption: string = "") {
    const titleEl = document.querySelector(".toast-title");
    const captionEl = document.querySelector(".toast-caption");
    const body = document.querySelector(".toast-body");
    const toast = document.querySelector(".toast");
    if (body && toast && captionEl && titleEl) {
      body.innerHTML = message;
      captionEl.innerHTML = caption;
      titleEl.innerHTML = title;
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 4999);
    }
  }
}
