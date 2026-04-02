package com.pengli.plugin.tts_engines

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.speech.tts.TextToSpeech
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin

private data class EngineDto(val name: String, val label: String)

@TauriPlugin
class TtsEnginesPlugin(private val activity: Activity) : Plugin(activity) {

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
}
