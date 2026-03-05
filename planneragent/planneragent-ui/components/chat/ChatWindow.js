import { renderChatInput } from "./ChatInput.js";
import { renderMessageRenderer } from "./MessageRenderer.js";

export function renderChatWindow(mountEl, state){
  mountEl.innerHTML = `
    <div class="chatShell">
      <div class="chatMessages" id="chatMessages"></div>
      <div class="chatInput" id="chatInput"></div>
    </div>
  `;

  const messagesEl = mountEl.querySelector("#chatMessages");
  renderMessageRenderer(messagesEl, state.chat.messages);

  const inputEl = mountEl.querySelector("#chatInput");
  renderChatInput(inputEl, state);
}
