import { invoke } from "@tauri-apps/api/core";

type TtsEngineInfo = {
  name: string;
  label: string;
};

const statusEl = document.querySelector("#status")!;
const listEl = document.querySelector("#engines")!;
const refreshBtn = document.querySelector("#refresh")!;

function setStatus(text: string) {
  statusEl.textContent = text;
}

function renderEngines(items: TtsEngineInfo[]) {
  listEl.innerHTML = "";
  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent =
      "没有枚举到任何引擎。若在真机上请确认已安装 TTS 应用，且 Manifest 中包含对 TTS_SERVICE 的 queries。";
    listEl.appendChild(li);
    return;
  }

  for (const e of items) {
    const li = document.createElement("li");
    const title = document.createElement("span");
    title.className = "label";
    title.textContent = e.label || "(无标题)";
    const pkg = document.createElement("code");
    pkg.className = "pkg";
    pkg.textContent = e.name;
    li.appendChild(title);
    li.appendChild(pkg);
    listEl.appendChild(li);
  }
}

async function refresh() {
  setStatus("加载中…");
  refreshBtn.setAttribute("disabled", "true");
  try {
    const engines = await invoke<TtsEngineInfo[]>(
      "plugin:tts-engines|list_tts_engines",
    );
    setStatus(`共 ${engines.length} 个引擎（按包名去重）`);
    renderEngines(engines);
  } catch (e) {
    console.error(e);
    setStatus(`出错：${e instanceof Error ? e.message : String(e)}`);
    listEl.innerHTML = "";
  } finally {
    refreshBtn.removeAttribute("disabled");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  refreshBtn.addEventListener("click", () => void refresh());
  void refresh();
});
