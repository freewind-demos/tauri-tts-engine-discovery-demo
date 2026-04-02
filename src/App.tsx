import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  List,
  Select,
  Space,
  Typography,
  message,
  Input,
} from "antd";
import { invoke } from "@tauri-apps/api/core";

export type TtsEngineInfo = { name: string; label: string };

const DEFAULT_TEXT =
  "这是一段中英文混合示例：Hello TTS! 请用当前选中的引擎朗读下面内容。Tauri on Android 支持系统 TTS，试试切换不同引擎。Good luck!";

export function App() {
  const [engines, setEngines] = useState<TtsEngineInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [selectedEngine, setSelectedEngine] = useState<string | undefined>(
    undefined,
  );
  const [text, setText] = useState(DEFAULT_TEXT);
  const [speaking, setSpeaking] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setStatus("加载中…");
    try {
      const list = await invoke<TtsEngineInfo[]>(
        "plugin:tts-engines|list_tts_engines",
      );
      setEngines(list);
      setStatus(`共 ${list.length} 个引擎（按包名去重）`);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(`出错：${msg}`);
      message.error(msg);
      setEngines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Android TTS 引擎与朗读
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        通过 Tauri Android 插件调用系统{" "}
        <Typography.Text code>
          PackageManager.queryIntentServices(TTS_SERVICE)
        </Typography.Text>
        枚举引擎，并用 <Typography.Text code>TextToSpeech</Typography.Text>{" "}
        按所选包名朗读。
      </Typography.Paragraph>

      <Card title="朗读" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Typography.Text type="secondary">朗读引擎</Typography.Text>
            <Select
              style={{ width: "100%", marginTop: 8 }}
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
            <Typography.Text type="secondary">文本</Typography.Text>
            <Input.TextArea
              style={{ marginTop: 8 }}
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
      </Card>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => void refresh()} loading={loading}>
          刷新引擎列表
        </Button>
      </Space>
      <Typography.Paragraph style={{ minHeight: 22 }}>{status}</Typography.Paragraph>
      <Card size="small">
        <List<TtsEngineInfo>
          bordered
          dataSource={engines}
          locale={{
            emptyText:
              "没有枚举到任何引擎。若在真机上请确认已安装 TTS 应用，且 Manifest 中包含对 TTS_SERVICE 的 queries。",
          }}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.label || "(无标题)"}
                description={<Typography.Text code>{item.name}</Typography.Text>}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
