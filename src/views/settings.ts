import type { IState } from "../models";

/**
 * Generate the HTML markup for the AI DJ settings configuration page
 * Displays a form where users can configure their AI DJ preferences:
 * - AI Chat Provider: Choose between Deepseek, ChatGPT, or Claude
 * - Chat Session Name: The user's name for personalized DJ interactions
 * - Chat Postal Code: User's location for local weather forecasts
 *
 * The form includes Save and Cancel buttons that navigate back to the previous view
 *
 * @param state - The current application state containing:
 *   - chatType: Currently selected AI provider ("deep", "announce", or "claude")
 *   - chatName: User's name for AI DJ personalization
 *   - chatZip: User's ZIP/postal code for location-based features
 *   - previous: Object containing the view/page to return to after save/cancel
 * @returns HTML string representing the complete settings form
 */
export function appSettings(state: IState) {
  // Get the previous view information to enable "back" navigation after save/cancel
  const previous = state.previous;

  // Build data attributes for the Save/Cancel buttons to enable navigation back
  // If there's a detail ID (e.g., returning to a specific album/artist page),
  // include both the view type and the ID
  // Otherwise, just include the view name (e.g., returning to library list)
  const attributes = previous?.id
    ? `data-type="${previous?.view}" data-id="${previous.id}"`
    : `data-view="${previous?.view}"`;

  return `
    <div class="container mt-4">
      <h3 class="mb-4">Skytunes Settings</h3>
      <form id="chatSettingsForm">
        
        <!-- Radio Group for AI Chat Provider Selection -->
        <!-- Users choose which AI model will power the DJ interactions -->
        <div class="mb-4">
          <label class="form-label fw-bold">AI Chat Provider</label>
          
          <!-- Deepseek option - lightweight, fast AI model -->
          <div class="form-check">
            <input 
              class="form-check-input" 
              type="radio" 
              name="chatType" 
              id="chatTypeDeep" 
              value="deep" 
              ${
                /* Pre-check this radio button if Deepseek is currently selected */
                state.chatType === "deep" ? "checked" : ""
              }
            >
            <label class="form-check-label" for="chatTypeDeep">
              Deepseek
            </label>
          </div>
          
          <!-- ChatGPT option - OpenAI's conversational AI model -->
          <div class="form-check">
            <input 
              class="form-check-input" 
              type="radio" 
              name="chatType" 
              id="chatTypeAnnounce" 
              value="announce" 
              ${
                /* Pre-check this radio button if ChatGPT is currently selected */
                state.chatType === "announce" ? "checked" : ""
              }
            >
            <label class="form-check-label" for="chatTypeAnnounce">
              ChatGPT
            </label>
          </div>
          
          <!-- Claude option - Anthropic's conversational AI model -->
          <div class="form-check">
            <input 
              class="form-check-input" 
              type="radio" 
              name="chatType" 
              id="chatTypeClaude" 
              value="claude" 
              ${
                /* Pre-check this radio button if Claude is currently selected */
                state.chatType === "claude" ? "checked" : ""
              }
            >
            <label class="form-check-label" for="chatTypeClaude">
              Claude
            </label>
          </div>
          
          <!-- Help text explaining the purpose of this setting -->
          <div class="form-text">Choose your preferred AI chat provider</div>
        </div>

        <!-- Text Input for User's Name -->
        <!-- The AI DJ uses this name to personalize interactions and shoutouts -->
        <div class="mb-4">
          <label for="chatName" class="form-label fw-bold">Chat Session Name</label>
          <input 
            type="text" 
            class="form-control" 
            id="chatName" 
            name="chatName" 
            value="${
              /* Pre-fill with existing name or empty string if not set */
              state.chatName || ""
            }" 
            placeholder="Enter a name for your chat session"
          >
          <!-- Help text explaining how the AI DJ will use this name -->
          <div class="form-text">Tell the DJ your name so it can shout out to you!</div>
        </div>

        <!-- Text Input for User's ZIP/Postal Code -->
        <!-- Used for location-based features like local weather forecasts -->
        <div class="mb-4">
          <label for="chatZip" class="form-label fw-bold">Chat Postal Code</label>
          <input 
            type="text" 
            class="form-control" 
            id="chatZip" 
            name="chatZip" 
            value="${
              /* Pre-fill with existing ZIP code or empty string if not set */
              state.chatZip || ""
            }" 
            placeholder="Enter your zip/postal code"
          >
          <!-- Help text explaining how the AI DJ will use this location info -->
          <div class="form-text">Tell the DJ where you are to get your local forecast</div>
        </div>

        <!-- Save button - saves settings and navigates back to previous view -->
        <!-- Data attributes allow the click handler to know where to navigate back to -->
        <button type="submit" class="btn settings-btn btn-primary" ${attributes}>Save Settings</button>
        
        <!-- Cancel button - discards changes and navigates back to previous view -->
        <!-- Data attributes allow the click handler to know where to navigate back to -->
        <button class="btn cancel-btn btn-default" ${attributes}>Cancel</button>
      </form>
    </div>
  `;
}
