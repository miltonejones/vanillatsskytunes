import type { IState } from "../models";

export function appSettings(state: IState) {
  const previous = state.previous;
  const attributes = previous?.id
    ? `data-type="${previous?.view}" data-id="${previous.id}"`
    : `data-view="${previous?.view}"`;
  return `
    <div class="container mt-4">
      <h3 class="mb-4">Skytunes Settings</h3>
      <form id="chatSettingsForm">
        <!-- Radio Group for Chat Type -->
        <div class="mb-4">
          <label class="form-label fw-bold">AI Chat Provider</label>
          <div class="form-check">
            <input 
              class="form-check-input" 
              type="radio" 
              name="chatType" 
              id="chatTypeDeep" 
              value="deep" 
              ${state.chatType === "deep" ? "checked" : ""}
            >
            <label class="form-check-label" for="chatTypeDeep">
              Deepseek
            </label>
          </div>
          <div class="form-check">
            <input 
              class="form-check-input" 
              type="radio" 
              name="chatType" 
              id="chatTypeAnnounce" 
              value="announce" 
              ${state.chatType === "announce" ? "checked" : ""}
            >
            <label class="form-check-label" for="chatTypeAnnounce">
              ChatGPT
            </label>
          </div>
          <div class="form-check">
            <input 
              class="form-check-input" 
              type="radio" 
              name="chatType" 
              id="chatTypeClaude" 
              value="claude" 
              ${state.chatType === "claude" ? "checked" : ""}
            >
            <label class="form-check-label" for="chatTypeClaude">
              Claude
            </label>
          </div>
          <div class="form-text">Choose your preferred AI chat provider</div>
        </div>

        <!-- Text Input for Chat Name -->
        <div class="mb-4">
          <label for="chatName" class="form-label fw-bold">Chat Session Name</label>
          <input 
            type="text" 
            class="form-control" 
            id="chatName" 
            name="chatName" 
            value="${state.chatName || ""}" 
            placeholder="Enter a name for your chat session"
          >
          <div class="form-text">Tell the DJ your name so it can shout out to you!</div>
        </div>

        <!-- Text Input for Chat Zip -->
        <div class="mb-4">
          <label for="chatZip" class="form-label fw-bold">Chat Postal Code</label>
          <input 
            type="text" 
            class="form-control" 
            id="chatZip" 
            name="chatZip" 
            value="${state.chatZip || ""}" 
            placeholder="Enter your zip/postal code"
          >
          <div class="form-text">Tell the DJ where you are to get your local forecast</div>
        </div>

        <button type="submit" class="btn settings-btn btn-primary" ${attributes}>Save Settings</button>
        <button class="btn cancel-btn btn-default" ${attributes}>Cancel</button>
      </form>
    </div>
  `;
}
