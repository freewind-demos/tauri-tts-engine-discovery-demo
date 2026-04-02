package com.pengli.plugin.tts_engines

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.speech.tts.TextToSpeech
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import java.util.Locale

private data class EngineDto(val name: String, val label: String)

@InvokeArg
class SpeakArgs {
    lateinit var text: String
    var engine: String? = null
}

@TauriPlugin
class TtsEnginesPlugin(private val activity: Activity) : Plugin(activity) {

    private var tts: TextToSpeech? = null
    private var boundEngine: String? = null

    private fun applyLocale(t: TextToSpeech) {
        var r = t.setLanguage(Locale.forLanguageTag("zh-CN"))
        if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
            r = t.setLanguage(Locale.US)
            if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                t.setLanguage(Locale.getDefault())
            }
        }
    }

    @Command
    fun listEngines(invoke: Invoke) {
        try {
            val pm = activity.packageManager
            val intent = Intent(TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE)
            @Suppress("DEPRECATION")
            val flagsLegacy = PackageManager.GET_META_DATA

            val resolveInfos =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    pm.queryIntentServices(
                        intent,
                        PackageManager.ResolveInfoFlags.of(flagsLegacy.toLong()),
                    )
                } else {
                    pm.queryIntentServices(intent, flagsLegacy)
                }

            val byPackage = LinkedHashMap<String, EngineDto>()
            for (ri in resolveInfos) {
                val pkg = ri.serviceInfo.packageName
                val label = ri.loadLabel(pm).toString()
                if (!byPackage.containsKey(pkg)) {
                    byPackage[pkg] = EngineDto(name = pkg, label = label)
                }
            }

            val payload = mapOf("engines" to byPackage.values.toList())
            invoke.resolveObject(payload)
        } catch (e: Exception) {
            invoke.reject(e.message ?: "listEngines failed", e)
        }
    }

    @Command
    fun speak(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(SpeakArgs::class.java)
            val text = args.text.trim()
            if (text.isEmpty()) {
                invoke.reject("文本为空")
                return
            }
            val enginePkg = args.engine?.trim()?.takeIf { it.isNotEmpty() }

            if (tts != null && boundEngine == enginePkg) {
                tts?.stop()
                val t = tts!!
                applyLocale(t)
                val r = t.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tts-demo")
                if (r == TextToSpeech.ERROR) {
                    invoke.reject("朗读失败（speak 返回 ERROR）")
                } else {
                    invoke.resolve()
                }
                return
            }

            tts?.stop()
            tts?.shutdown()
            tts = null
            boundEngine = null

            tts = TextToSpeech(activity.applicationContext, { status ->
                if (status != TextToSpeech.SUCCESS) {
                    invoke.reject("TTS 初始化失败")
                    return@TextToSpeech
                }
                val instance = tts ?: run {
                    invoke.reject("TTS 实例无效")
                    return@TextToSpeech
                }
                boundEngine = enginePkg
                applyLocale(instance)
                val r = instance.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tts-demo")
                if (r == TextToSpeech.ERROR) {
                    invoke.reject("朗读失败")
                } else {
                    invoke.resolve()
                }
            }, enginePkg)
        } catch (e: Exception) {
            invoke.reject(e.message ?: "speak failed", e)
        }
    }

    @Command
    fun stopSpeak(invoke: Invoke) {
        try {
            tts?.stop()
            invoke.resolve()
        } catch (e: Exception) {
            invoke.reject(e.message ?: "stopSpeak failed", e)
        }
    }
}
