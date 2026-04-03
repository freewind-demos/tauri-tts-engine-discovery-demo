import { useCallback, useEffect, useState } from "react";
import { Button, Select, Space, message, Input } from "antd";
import { invoke } from "@tauri-apps/api/core";

export type TtsEngineInfo = { name: string; label: string };

const DEFAULT_TEXT =
  "这是一段中英文混合示例：Hello TTS! 请用当前选中的引擎朗读下面内容。Tauri on Android 支持系统 TTS，试试切换不同引擎。Good luck!";

const labelSecondary = {
  display: "block" as const,
  marginBottom: 8,
  color: "rgba(0, 0, 0, 0.45)",
  fontSize: 14,
};

export function App() {
  const [engines, setEngines] = useState<TtsEngineInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<string | undefined>(
    undefined,
  );
  const [text, setText] = useState(DEFAULT_TEXT);
  const [speaking, setSpeaking] = useState(false);

  const loadEngines = useCallback(async () => {
    setLoading(true);
    try {
      const list = await invoke<TtsEngineInfo[]>(
        "plugin:tts-engines|list_tts_engines",
      );
      setEngines(list);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      message.error(msg);
      setEngines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEngines();
  }, [loadEngines]);

  const onSpeak = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      message.warning("请先输入要朗读的文字");
      return;
    }
    setSpeaking(true);
    try {
      await invoke("plugin:tts-engines|speak", {
        text: trimmed,
        engine: selectedEngine ?? null,
      });
    } catch (e) {
      console.error(e);
      message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSpeaking(false);
    }
  };

  const onStop = async () => {
    try {
      await invoke("plugin:tts-engines|stop_speak");
    } catch (e) {
      console.error(e);
      message.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div>
          <span style={labelSecondary}>朗读引擎</span>
          <Select
            style={{ width: "100%" }}
            loading={loading}
            placeholder="系统默认（不指定引擎包名）"
            allowClear
            value={selectedEngine}
            onChange={(v) => setSelectedEngine(v)}
            options={engines.map((e) => ({
              label: `${e.label} (${e.name})`,
              value: e.name,
            }))}
          />
        </div>
        <div>
          <span style={labelSecondary}>文本</span>
          <Input.TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
          />
        </div>
        <Space>
          <Button
            type="primary"
            loading={speaking}
            onClick={() => void onSpeak()}
          >
            朗读
          </Button>
          <Button onClick={() => void onStop()}>停止</Button>
        </Space>
      </Space>
    </div>
  );
}
