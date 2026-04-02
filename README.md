# Tauri Android TTS 引擎枚举 Demo

## 简介

这个 Demo 用来验证 **Tauri 2** 在 **Android** 上能否枚举系统里已安装的 **TTS（文字转语音）引擎**，包括系统自带引擎和用户自行安装的第三方引擎（例如讯飞语记等应用所注册的 TTS 服务，前提是该应用按 Android 规范导出了 `TTS_SERVICE`）。

说明：若你口语里说的「Torii」是指 **Tauri**，本仓库就是基于 Tauri 2 的；若是别的框架，需要另做适配。

## 快速开始

### 环境要求

- Node 与 **pnpm**
- **Rust**（含 `rustup`）与 Android 目标三元组：`aarch64-linux-android` 等（首次用 `pnpm tauri android dev` 时 CLI 可协助安装）
- Android SDK / NDK（本机已配置 `ANDROID_HOME` 等常见变量的情况下，`tauri android` 子命令可正常工作）

### 安装依赖

```bash
cd /Users/peng.li/workspace/freewind-demos/tauri-tts-engine-discovery-demo
pnpm install
```

首次在本机编译 Android 工程时，Tauri 会在本地插件目录下生成 `android/.tauri/`（已加入 `.gitignore`），不必提交到仓库。

### 桌面端（枚举结果为空）

桌面端没有实现 Android `PackageManager` 逻辑，接口仍会返回空数组，仅用于确认工程能编译运行：

```bash
pnpm tauri dev
```

### Android 真机 / 模拟器

```bash
pnpm android:dev
```

（与上面等价、且补齐 `PATH` 的封装；仍可直接使用 `pnpm tauri android dev`。）

连接设备或启动模拟器后，App 打开会自动拉取一次列表；也可点击「刷新列表」。

若需构建 **APK**（默认 **Release**，ProGuard 压缩混淆，体积比 Debug 小很多），推荐：

```bash
pnpm android:build
```

等价于 `tauri android build --apk --ci`。若你直接用 GUI 或 IDE 跑构建、未加载 shell 里的 Rust 环境，因而出现 `rustup target add: No such file or directory`，请优先用上面的脚本，或保证本机 `PATH` 已包含 `~/.cargo/bin`。

Release 通用包 APK 一般在（以 Gradle 输出为准）：

`src-tauri/gen/android/app/build/outputs/apk/universal/release/`

需要带调试符号、包体较大时，再打 **Debug**：

```bash
pnpm build:android:debug
```

或 `pnpm android:build:debug`。产物目录通常为 `.../apk/universal/debug/`。

`pnpm build:android:release` 与 `pnpm android:build:release` 与默认的 `pnpm build:android` 相同，仅为兼容保留。

也可用：

```bash
pnpm tauri android build
```

### Android Release 签名

**Release APK 会一直带签名**：若存在 `src-tauri/gen/android/key.properties`，则用你自己的上传密钥签名；**若没有**，Gradle 会使用 Android 默认的 **debug keystore** 给 **release** 包签名（仍是混淆后的 Release 产物，只是证书与 Debug 构建相同），一般可直接装手机验证功能。

要上架应用商店或长期固定证书，再在目录 `src-tauri/gen/android/` 配置 **`key.properties`**（已在 `.gitignore`，勿提交）：

1. 生成 keystore（仅需做一次）：

```bash
cd src-tauri/gen/android
keytool -genkey -v -keystore your-release.keystore -alias your-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. `cp key.properties.example key.properties` 并按示例填写 `storeFile`（相对 `gen/android/` 的文件名）、`keyAlias`、`storePassword`、`keyPassword`。

3. 再执行 `pnpm android:build`，此时 Release 会改用该正式密钥。

仅本地调试且不在意体积时可用 `pnpm android:build:debug`。

## 概念讲解

### 第一部分：为什么需要 `<queries>`（Android 11+）

从 Android 11 起，应用默认看不到其它包的组件。要枚举 **TTS 引擎服务**，本 Demo 在 **应用** 的 `AndroidManifest.xml` 里增加了对 `android.intent.action.TTS_SERVICE` 的 `queries` 声明。若缺少这一段，列表里往往只能看到极少数条目甚至为空。

当前补丁位置示例：

```xml
<queries>
    <intent>
        <action android:name="android.intent.action.TTS_SERVICE" />
    </intent>
</queries>
```

文件路径：`src-tauri/gen/android/app/src/main/AndroidManifest.xml`。

注意：若你今后重新执行 `tauri android init` 或生成脚本覆盖了 `gen/android`，需要**再次检查**该段是否还在。

### 第二部分：枚举实现方式

Kotlin 插件里使用系统 API：

```kotlin
val intent = Intent(TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE)
packageManager.queryIntentServices(intent, flags)
```

对每个 `ResolveInfo` 取 **`serviceInfo.packageName`** 作为引擎包名，**`loadLabel(packageManager)`** 作为展示名称；并按包名去重，避免同一包多服务重复显示。

### 第三部分：与前端、Rust 的衔接

- 前端通过 `invoke("plugin:tts-engines|list_tts_engines")` 枚举引擎；`invoke("plugin:tts-engines|speak", { text, engine })` 朗读（`engine` 可省略表示系统默认）；`invoke("plugin:tts-engines|stop_speak")` 停止当前队列（Tauri 2 插件命令须带 `plugin:<名>|<命令>` 前缀）。
- Rust 侧注册本地 crate 插件 **`tauri-plugin-tts-engines`**，在 Android 上通过 `run_mobile_plugin("listEngines", ())` 调到上述 Kotlin。
- `src-tauri/capabilities/default.json` 中已加入 `tts-engines:allow-list-tts-engines` 权限，否则调用会被 ACL 拒绝。

## 完整示例：前端调用

```typescript
import { invoke } from "@tauri-apps/api/core";

type TtsEngineInfo = { name: string; label: string };

const engines = await invoke<TtsEngineInfo[]>(
  "plugin:tts-engines|list_tts_engines",
);
console.log(engines);
```

返回的 `name` 为引擎包名，`label` 为系统在设置里可能显示的标题。

## 关于讯飞语记等第三方引擎

- 若某应用**没有**在系统里注册可被查询的 `TTS_SERVICE`，它将**不会**出现在列表里——这与是否使用 Tauri 无关，属于 Android 包可见性与该应用的导出方式问题。
- 若**已注册**且本 App 的 `queries` 正确，通常会与其它 TTS 应用一样出现在列表中。
- 讯飞产品线的包名、可见性可能随版本变化；请以你手机上实际枚举到的 `name` 为准。

## Release 与 ProGuard

Release 构建开启混淆时，已为插件包加了保留规则，文件：`src-tauri/gen/android/app/proguard-rules.pro`（`-keep class com.pengli.plugin.tts_engines.**`）。

## 注意事项

- 本 Demo **只枚举引擎**，不朗读文本、不切换默认引擎；若后续要做朗读，需要再接入 `TextToSpeech` 实例并指定 `engine` 包名等。
- 插件 Rust 代码位于 `src-tauri/plugins/tauri-plugin-tts-engines`，Android Kotlin 位于同目录下的 `android/src/main/java/...`。

## 完整讲解（中文）

移动端上要回答的问题是：「我这个 App 能不能像系统设置那样，看到装过的 TTS 引擎？」在 Android 上，答案取决于两层：一是系统是否允许你的包去 **查询** 其它包的 `TTS_SERVICE` 声明，这就是 Manifest 里 `<queries>` 的作用；二是对方应用是否真的 **声明并导出** 了符合规范的 TTS 服务，否则你在设置里也许能用它朗读，但通过 `queryIntentServices` 仍可能枚举不到，这是应用开发商实现方式决定的。

Tauri 本身跑在 WebView + Rust 里，不自带「列出 TTS 引擎」的 API，所以本 Demo 写了一个 **极小的 Android 插件**：Kotlin 调系统 API 拿列表，再把结果序列化回 Rust，最后由前端 `invoke` 拿到 JSON。这样你在真机上点「刷新列表」，看到的就是当前系统对你的 App **可见** 的全部 TTS 引擎包。若你装了讯飞语记并希望它的引擎出现，只要它在系统层面注册了可被查到的 TTS 服务，就会和 Google TTS、厂商自带引擎一起列出来；若没有，就需要换一个验证目标或检查该 App 的组件导出方式，而不是怀疑 Tauri「拿不到」——Tauri 只是把 JavaScript 和原生桥接起来，底层规则仍是 Android 的。
