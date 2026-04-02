import { useCallback, useEffect, useState } from "react";
import { Button, Card, List, Space, Typography, message } from "antd";
import { invoke } from "@tauri-apps/api/core";

export type TtsEngineInfo = { name: string; label: string };

export function App() {
  const [engines, setEngines] = useState<TtsEngineInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

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

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Android TTS 引擎列表
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        通过 Tauri Android 插件调用系统{" "}
        <Typography.Text code>
          PackageManager.queryIntentServices(TTS_SERVICE)
        </Typography.Text>
        ，枚举本机已安装的朗读引擎（含系统自带与第三方）。
      </Typography.Paragraph>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => void refresh()} loading={loading}>
          刷新列表
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
