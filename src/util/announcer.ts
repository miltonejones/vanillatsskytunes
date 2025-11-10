// announcer.ts

interface AnnounceResponse {
  messageContent: string;
  // Add other properties if they exist in the actual response
  [key: string]: any;
}

interface SpeechSynthesisUtteranceEvent extends Event {
  // You can extend this with specific properties if needed
}

type SpeechCallback = (
  event?: SpeechSynthesisUtteranceEvent,
  messageContent?: string
) => void;

/**
 * Removes all dots from a string
 */
const dotless = (str: string | null | undefined): string => {
  return str?.replace(/\./g, "") || "";
};

/**
 * Announces track changes using speech synthesis
 */
export async function announceChange(
  artist: string | null | undefined,
  title: string | null | undefined,
  ms: number,
  chatType: string = "deep",
  chatName: string,
  chatZip: string,
  onSpeechStart: SpeechCallback | null = null,
  onSpeechEnd: SpeechCallback | null = null
): Promise<boolean> {
  // Skip announcement for short tracks (less than 2.5 minutes)
  if (ms < 150000) {
    onSpeechEnd?.();
    return false;
  }

  const time = new Date().toLocaleTimeString();

  const requestOptions: RequestInit = {
    method: "POST",
    body: JSON.stringify({
      artist: dotless(artist),
      title: dotless(title),
      name: chatName,
      location: chatZip,
      time,
    }),
  };

  try {
    const response = await fetch(
      `https://ismvqzlyrf.execute-api.us-east-1.amazonaws.com/${chatType}`,
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json: AnnounceResponse = await response.json();

    if (!json.messageContent) {
      onSpeechEnd?.();
      return false;
    }

    const { messageContent } = json;

    console.log("Announcement response:", { json });

    const utterance = new SpeechSynthesisUtterance(messageContent);

    // Set up event listeners for speech start and end
    utterance.onstart = (event: SpeechSynthesisUtteranceEvent) => {
      console.log("Speech started");
      if (onSpeechStart && typeof onSpeechStart === "function") {
        onSpeechStart(event, messageContent);
      }
    };

    utterance.onend = (event: SpeechSynthesisUtteranceEvent) => {
      console.log("Speech ended");
      if (onSpeechEnd && typeof onSpeechEnd === "function") {
        onSpeechEnd(event, messageContent);
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error("Speech synthesis error:", event.error);
      onSpeechEnd?.();
    };

    // Configure voice properties
    utterance.rate = 1.0; // Speaking rate (0.1 to 10)
    utterance.pitch = 1.0; // Pitch (0 to 2)
    utterance.volume = 1.0; // Volume (0 to 1)
    utterance.lang = "en-US";

    // Cancel any ongoing speech before starting new one
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    // Speak the text
    window.speechSynthesis.speak(utterance);

    return true;
  } catch (error) {
    console.error("Announcement failed:", error);
    onSpeechEnd?.();
    return false;
  }
}

/**
 * Checks if speech synthesis is currently speaking
 */
export function isSpeaking(): boolean {
  return window.speechSynthesis.speaking;
}

/**
 * Gets available voices (useful for debugging or voice selection)
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis.getVoices();
}
