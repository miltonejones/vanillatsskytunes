export function stopAnnouncement(): void {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
}
