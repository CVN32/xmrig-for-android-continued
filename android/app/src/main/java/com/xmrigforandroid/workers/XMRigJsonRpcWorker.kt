package com.xmrigforandroid.workers

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

class XMRigJsonRpcWorker(appContext: Context, workerParams: WorkerParameters) :
    CoroutineWorker(appContext, workerParams) {

    private val client = OkHttpClient()

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val method = inputData.getString("METHOD")
        if (method.isNullOrBlank()) {
            Log.e(LOG_TAG, "Missing JSON-RPC method")
            return@withContext Result.failure()
        }

        Log.d(LOG_TAG, "Sending JSON RPC to XMRig: $method")
        val requestBody = "{\"method\":\"$method\",\"id\":1}"
            .toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url("http://127.0.0.1:50080/json_rpc")
            .post(requestBody)
            .addHeader("Authorization", "Bearer XMRigForAndroid")
            .build()

        try {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e(LOG_TAG, "JSON-RPC failed with HTTP ${response.code}")
                    return@withContext Result.failure()
                }
                Result.success()
            }
        } catch (e: Exception) {
            Log.e(LOG_TAG, "JSON-RPC request failed", e)
            Result.failure()
        }
    }

    companion object {
        private const val LOG_TAG = "XMRigJsonRpcWorker"
    }
}
