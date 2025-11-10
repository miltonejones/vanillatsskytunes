import type { IState } from "../models";
import { appSettings } from "../views/settings";
import { ToastController } from "./toastController";

interface ISettings {
  type: string;
  name: string;
  zip: string;
}

export class SettingsController {
  store;
  settings: ISettings;
  COOKIE_NAME: string = "sky-tunes-settings";
  toast;
  constructor(store: any) {
    this.store = store;
    this.settings = {
      type: "deep",
      name: "Milton",
      zip: "30310",
    };

    this.loadSettings();
    this.bindEvents();
    this.toast = new ToastController();
  }

  render(state: IState) {
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = appSettings(state);
    }
  }

  bindEvents() {
    document.addEventListener("click", this.handleClick.bind(this), true);
    document.addEventListener("change", this.handleChange.bind(this), true);
    document.addEventListener("input", this.handleInput.bind(this), true);
  }

  handleClick(e: MouseEvent) {
    console.log("handleClick");
    e.stopPropagation();

    let target = e.target as Element;
    if (target.matches(".settings-btn") || target.closest(".settings-btn")) {
      e.preventDefault();
      this.saveSettings();
    }
  }

  handleChange(e: Event) {
    console.log("handleChange");
    let target = e.target as HTMLInputElement;
    if (target.name === "chatType") {
      this.settings.type = target.value;
    }
  }

  handleInput(e: Event) {
    console.log("handleInput");
    let target = e.target as HTMLInputElement;
    if (target.name === "chatName") {
      this.settings.name = target.value;
    }
    if (target.name === "chatZip") {
      this.settings.zip = target.value;
    }
  }

  loadSettings() {
    const previous = localStorage.getItem(this.COOKIE_NAME);
    if (!previous) return;
    this.settings = JSON.parse(previous);
    this.store.setState({
      chatType: this.settings.type,
      chatName: this.settings.name,
      chatZip: this.settings.zip,
    });
  }

  saveSettings() {
    localStorage.setItem(this.COOKIE_NAME, JSON.stringify(this.settings));
    this.store.setState({
      chatType: this.settings.type,
      chatName: this.settings.name,
      chatZip: this.settings.zip,
    });
    this.toast.alert("Settings successfully updated");
  }
}
