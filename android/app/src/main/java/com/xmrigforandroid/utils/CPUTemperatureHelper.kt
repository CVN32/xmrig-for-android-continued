package com.xmrigforandroid.utils

import java.io.File

class CPUTemperatureHelper {
    companion object {
        private var tempPath: String? = null
        private val preferredTypes = listOf("cpu", "soc", "ap", "cluster", "package")

        private fun normalizeTemperature(raw: Float): Float {
            val celsius = if (raw > 1000.0f) raw / 1000.0f else raw
            return if (celsius in -20.0f..150.0f) celsius else Float.NaN
        }

        private fun readTemperature(path: String): Float {
            return try {
                val raw = File(path).bufferedReader().use { it.readLine()?.trim()?.toFloatOrNull() }
                    ?: return Float.NaN
                normalizeTemperature(raw)
            } catch (_: Exception) {
                Float.NaN
            }
        }

        @Synchronized
        fun searchCpuTemperature(): Float {
            val zones = File("/sys/devices/virtual/thermal/")
                .listFiles()
                ?.filter { it.isDirectory && it.name.startsWith("thermal_zone") }
                ?: emptyList()

            val ranked = zones.sortedBy { zone ->
                val type = try {
                    zone.resolve("type").bufferedReader().use { it.readLine()?.lowercase() ?: "" }
                } catch (_: Exception) {
                    ""
                }
                val index = preferredTypes.indexOfFirst { type.contains(it) }
                if (index >= 0) index else preferredTypes.size
            }

            for (zone in ranked) {
                val candidate = zone.resolve("temp").absolutePath
                val value = readTemperature(candidate)
                if (value.isFinite()) {
                    tempPath = candidate
                    return value
                }
            }

            // Do not cache a permanent "not found" result. Thermal zones can become
            // readable later in the process lifetime on some Android devices.
            tempPath = null
            return Float.NaN
        }

        @Synchronized
        fun getCpuTemperature(): Float {
            val cached = tempPath
            if (cached != null) {
                val value = readTemperature(cached)
                if (value.isFinite()) {
                    return value
                }
                tempPath = null
            }
            return searchCpuTemperature()
        }
    }
}
