package com.xmrigforandroid.services

import android.app.Service
import android.content.Intent
import android.os.CountDownTimer
import android.os.IBinder
import android.util.Log
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.xmrigforandroid.workers.ThermalWorker

class ThermalService : Service() {

    private var updateTimer: CountDownTimer? = null

    override fun onCreate() {
        super.onCreate()
        IS_SERVICE_RUNNING = true
        enqueueThermalSample()
        scheduleNextSample()
    }

    private fun enqueueThermalSample() {
        WorkManager.getInstance(applicationContext)
            .enqueue(OneTimeWorkRequestBuilder<ThermalWorker>().build())
    }

    private fun scheduleNextSample() {
        updateTimer?.cancel()
        updateTimer = object : CountDownTimer(UPDATE_INTERVAL_MS, UPDATE_INTERVAL_MS) {
            override fun onTick(millisUntilFinished: Long) = Unit

            override fun onFinish() {
                if (!IS_SERVICE_RUNNING) {
                    return
                }
                Log.d(LOG_TAG, "sampling CPU temperature")
                enqueueThermalSample()
                scheduleNextSample()
            }
        }.start()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onDestroy() {
        IS_SERVICE_RUNNING = false
        updateTimer?.cancel()
        updateTimer = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent): IBinder? = null

    companion object {
        private const val LOG_TAG = "ThermalService"
        private const val UPDATE_INTERVAL_MS = 15_000L
        @Volatile
        var IS_SERVICE_RUNNING = false
    }
}
