package com.xmrigforandroid.workers

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.xmrigforandroid.events.MinerSummaryEvent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.greenrobot.eventbus.EventBus

class XMRigSummaryUpdateWorker(appContext: Context, workerParams: WorkerParameters) :
    CoroutineWorker(appContext, workerParams) {

    private val client = OkHttpClient()

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("http://127.0.0.1:50080/2/summary")
            .addHeader("Authorization", "Bearer XMRigForAndroid")
            .build()

        try {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.d(LOG_TAG, "Summary endpoint returned HTTP ${response.code}")
                    return@withContext Result.failure()
                }

                val body = response.body?.string()
                if (body.isNullOrBlank()) {
                    Log.w(LOG_TAG, "Summary endpoint returned an empty body")
                    return@withContext Result.failure()
                }

                EventBus.getDefault().post(MinerSummaryEvent(body))
                Result.success()
            }
        } catch (e: Exception) {
            // The local API can briefly be unavailable while XMRig is starting or stopping.
            // The service schedules the next sample, so fail this sample without crashing the worker.
            Log.d(LOG_TAG, "Summary endpoint unavailable", e)
            Result.failure()
        }
    }

    companion object {
        private const val LOG_TAG = "XMRigSummaryUpdateWorker"
    }
}
