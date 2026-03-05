export function renderMessageRenderer(mountEl, messages){
  mountEl.innerHTML = messages.map(m => `<div class="msg">${m}</div>`).join("");
}
