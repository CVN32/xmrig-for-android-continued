package com.xmrigforandroid.services

import android.app.Service
import android.content.Intent
import android.os.CountDownTimer
import android.os.IBinder
import android.util.Log
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import com.xmrigforandroid.workers.XMRigJsonRpcWorker
import com.xmrigforandroid.workers.XMRigSummaryUpdateWorker

class XMRigAPIService : Service() {

    @Volatile
    private var isSummaryUpdate = false
    private var summaryUpdateTimer: CountDownTimer? = null

    override fun onCreate() {
        super.onCreate()
        IS_SERVICE_RUNNING = true
    }

    private fun enqueueSummaryUpdate() {
        WorkManager.getInstance(applicationContext)
            .enqueue(OneTimeWorkRequestBuilder<XMRigSummaryUpdateWorker>().build())
    }

    private fun scheduleNextSummaryUpdate() {
        summaryUpdateTimer?.cancel()
        summaryUpdateTimer = object : CountDownTimer(SUMMARY_INTERVAL_MS, SUMMARY_INTERVAL_MS) {
            override fun onTick(millisUntilFinished: Long) = Unit

            override fun onFinish() {
                if (!isSummaryUpdate) {
                    return
                }
                enqueueSummaryUpdate()
                scheduleNextSummaryUpdate()
            }
        }.start()
    }

    private fun sendJSONRpcCommand(method: String) {
        Log.d(LOG_TAG, "sendJSONRpcCommand: $method")
        val request = OneTimeWorkRequestBuilder<XMRigJsonRpcWorker>()
            .setInputData(workDataOf("METHOD" to method))
            .build()
        WorkManager.getInstance(applicationContext).enqueue(request)
    }

    private val binder = object : IXMRigAPIService.Stub() {
        override fun pauseMiner() {
            sendJSONRpcCommand("pause")
        }

        override fun resumeMiner() {
            sendJSONRpcCommand("resume")
        }

        override fun startSummaryUpdates() {
            if (isSummaryUpdate) {
                return
            }
            Log.d(LOG_TAG, "startSummaryUpdates")
            isSummaryUpdate = true
            enqueueSummaryUpdate()
            scheduleNextSummaryUpdate()
        }

        override fun stopSummaryUpdates() {
            if (!isSummaryUpdate && summaryUpdateTimer == null) {
                return
            }
            Log.d(LOG_TAG, "stopSummaryUpdates")
            isSummaryUpdate = false
            summaryUpdateTimer?.cancel()
            summaryUpdateTimer = null
        }
    }

    override fun onBind(intent: Intent): IBinder = binder

    override fun onDestroy() {
        isSummaryUpdate = false
        summaryUpdateTimer?.cancel()
        summaryUpdateTimer = null
        IS_SERVICE_RUNNING = false
        super.onDestroy()
    }

    companion object {
        private const val LOG_TAG = "XMRigAPIService"
        private const val SUMMARY_INTERVAL_MS = 10_000L

        @Volatile
        var IS_SERVICE_RUNNING = false
    }
}
