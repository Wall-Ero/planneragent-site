export function renderChatInput(mountEl, state){
  mountEl.innerHTML = `
    <button title="Add">+</button>
    <input placeholder="Type here..." />
    <button title="Voice">🎤</button>
    <button title="Expand/Collapse" id="expandLocal">⤢</button>
  `;

  const expand = mountEl.querySelector("#expandLocal");
  expand.addEventListener("click", () => {
    // toggle class on the cockpit root
    const cockpit = document.querySelector(".cockpit");
    if (cockpit) cockpit.classList.toggle("chat-expanded");
  });
}
