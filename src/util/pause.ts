export function pauseAnnouncement(): void {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
}
