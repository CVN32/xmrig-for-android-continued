package com.xmrigforandroid

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.ServiceConnection
import android.os.BatteryManager
import android.os.FileObserver
import android.os.IBinder
import android.os.RemoteException
import android.os.SystemClock
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.xmrigforandroid.data.serialization.Configuration
import com.xmrigforandroid.events.MinerStartEvent
import com.xmrigforandroid.events.MinerStopEvent
import com.xmrigforandroid.events.MinerSummaryEvent
import com.xmrigforandroid.events.PowerEvent
import com.xmrigforandroid.events.PowerEventAction
import com.xmrigforandroid.events.StdoutEvent
import com.xmrigforandroid.events.ThermalEvent
import com.xmrigforandroid.services.IXMRigAPIService
import com.xmrigforandroid.services.ThermalService
import com.xmrigforandroid.services.XMRigAPIService
import com.xmrigforandroid.utils.XMRigConfigBuilder
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import org.greenrobot.eventbus.EventBus
import org.greenrobot.eventbus.Subscribe
import org.greenrobot.eventbus.ThreadMode
import java.io.File
import java.lang.Exception
import java.net.Inet4Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket
import java.util.Locale

class XMRigForAndroid(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    @Volatile
    private var miningService: IMiningService? = null

    @Volatile
    private var xmrigAPIService: IXMRigAPIService? = null

    private val configBuilder = XMRigConfigBuilder(reactApplicationContext.applicationContext)

    @Volatile
    private var isMining = false

    @Volatile
    private var pendingStart: Pair<String, String>? = null

    @Volatile
    private var batteryReceiverRegistered = false

    private val serverConnection = object : ServiceConnection {
        override fun onServiceConnected(className: ComponentName?, service: IBinder?) {
            Log.d(name, "Service connected: ${className?.className}")
            when (className?.className) {
                MiningService::class.java.name -> {
                    val connectedService = IMiningService.Stub.asInterface(service)
                    miningService = connectedService

                    val pending = pendingStart
                    if (pending != null) {
                        try {
                            pendingStart = null
                            connectedService.startMiner(pending.first, pending.second)
                        } catch (e: RemoteException) {
                            Log.e(name, "Unable to start queued miner request", e)
                            EventBus.getDefault().post(StdoutEvent("Unable to start miner: ${e.message}"))
                            EventBus.getDefault().post(MinerStopEvent())
                        }
                    }

                    if (currentMinerStatus()) {
                        try {
                            xmrigAPIService?.startSummaryUpdates()
                        } catch (e: RemoteException) {
                            Log.w(name, "Unable to restore summary updates", e)
                        }
                    }
                    emitMinerStatus()
                }
                XMRigAPIService::class.java.name -> {
                    xmrigAPIService = IXMRigAPIService.Stub.asInterface(service)
                    if (currentMinerStatus()) {
                        try {
                            xmrigAPIService?.startSummaryUpdates()
                        } catch (e: RemoteException) {
                            Log.w(name, "Unable to start summary updates", e)
                        }
                    }
                }
            }
        }

        override fun onServiceDisconnected(className: ComponentName?) {
            Log.w(name, "Service disconnected: ${className?.className}")
            when (className?.className) {
                MiningService::class.java.name -> miningService = null
                XMRigAPIService::class.java.name -> xmrigAPIService = null
            }
        }
    }

    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action != Intent.ACTION_BATTERY_CHANGED) {
                return
            }
            publishBatteryIntent(intent)
        }
    }

    init {
        startAndBindServices(context)
    }

    private fun startAndBindServices(context: ReactApplicationContext) {
        val appContext = context.applicationContext
        arrayOf(
            MiningService::class.java,
            XMRigAPIService::class.java,
            ThermalService::class.java,
        ).forEach { serviceClass ->
            val intent = Intent(appContext, serviceClass)
            try {
                if (serviceClass == MiningService::class.java) {
                    appContext.startForegroundService(intent)
                } else {
                    appContext.startService(intent)
                }
                val bound = appContext.bindService(intent, serverConnection, Context.BIND_AUTO_CREATE)
                if (!bound) {
                    Log.e(name, "Failed to bind ${serviceClass.name}")
                }
            } catch (e: Exception) {
                Log.e(name, "Failed to start/bind ${serviceClass.name}", e)
            }
        }
    }

    private fun publishBatteryIntent(intent: Intent) {
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        if (level >= 0 && scale > 0) {
            val percent = (level * 100.0f) / scale.toFloat()
            EventBus.getDefault().post(PowerEvent(PowerEventAction.BATTERY_CHANGED, percent))
        }

        val plugged = intent.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0)
        EventBus.getDefault().post(
            PowerEvent(
                if (plugged > 0) PowerEventAction.POWER_CONNECTED
                else PowerEventAction.POWER_DISCONNECTED,
            ),
        )

        val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
        if (status == BatteryManager.BATTERY_STATUS_FULL) {
            EventBus.getDefault().post(PowerEvent(PowerEventAction.BATTERY_OKAY))
        }
    }

    private val fileObserver: FileObserver = object : FileObserver(File(configBuilder.getConfigPath()), MODIFY) {
        override fun onEvent(event: Int, path: String?) {
            Log.d("FileObserver", "event=$event path=$path isMining=$isMining")
            if (!isMining) {
                return
            }
            try {
                val payload = Arguments.createMap()
                payload.putString("config", configBuilder.readConfigFromDisk())
                emit("onConfigUpdate", payload)
            } catch (e: Exception) {
                Log.w(name, "Unable to read updated config", e)
            }
        }
    }

    private fun emit(eventName: String, payload: Any?) {
        if (!reactApplicationContext.hasActiveCatalystInstance()) {
            return
        }
        reactApplicationContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit(eventName, payload)
    }

    private fun currentMinerStatus(): Boolean {
        val queued = pendingStart != null
        val service = miningService
        if (service != null) {
            try {
                val running = service.isMinerRunning()
                isMining = running
                return running || queued
            } catch (e: RemoteException) {
                Log.w(name, "Unable to query miner process state", e)
            }
        }
        return isMining || queued
    }

    private fun emitMinerStatus() {
        val payload = Arguments.createMap()
        payload.putBoolean("isWorking", currentMinerStatus())
        emit("onStatusChange", payload)
    }

    @Subscribe(threadMode = ThreadMode.ASYNC)
    fun onMessageEvent(event: StdoutEvent) {
        val payload = Arguments.createMap()
        payload.putArray("log", Arguments.fromArray(arrayOf(event.value)))
        emit("onLog", payload)
    }

    @Subscribe(threadMode = ThreadMode.ASYNC)
    fun onMinerStartEvent(event: MinerStartEvent) {
        isMining = true
        try {
            xmrigAPIService?.startSummaryUpdates()
        } catch (e: RemoteException) {
            Log.w(name, "Unable to start summary updates", e)
        }

        emitMinerStatus()
    }

    @Subscribe(threadMode = ThreadMode.ASYNC)
    fun onMinerStopEvent(event: MinerStopEvent) {
        isMining = false
        try {
            xmrigAPIService?.stopSummaryUpdates()
        } catch (e: RemoteException) {
            Log.w(name, "Unable to stop summary updates", e)
        }

        emitMinerStatus()
    }

    @Subscribe(threadMode = ThreadMode.ASYNC)
    fun onPowerEvent(event: PowerEvent) {
        val payload = Arguments.createMap()
        payload.putString("action", event.action.toString())
        event.value?.let { payload.putDouble("value", it.toDouble()) }
        emit("onPower", payload)
    }

    @Subscribe(threadMode = ThreadMode.ASYNC)
    fun onMinerSummaryEvent(event: MinerSummaryEvent) {
        event.value?.let {
            val payload = Arguments.createMap()
            payload.putString("data", it)
            emit("onSummary", payload)
        }
    }

    @Subscribe(threadMode = ThreadMode.ASYNC)
    fun onThermalEvent(event: ThermalEvent) {
        val payload = Arguments.createMap()
        payload.putDouble("cpuTemperature", event.cpuTemperature.toDouble())
        emit("onThermal", payload)
    }

    @ReactMethod
    fun start(configurationJSON: String) {
        try {
            val jsonFormat = Json {
                explicitNulls = false
                ignoreUnknownKeys = true
            }
            val data = jsonFormat.decodeFromString<Configuration>(configurationJSON)

            Log.d(name, "Start XMRig (${data.xmrig_fork.toString().lowercase(Locale.ROOT)})")

            configBuilder.reset()
            configBuilder.setConfiguration(data)
            val configPath = configBuilder.writeConfig()
            fileObserver.startWatching()

            val fork = data.xmrig_fork.toString()
            val service = miningService
            if (service == null) {
                Log.i(name, "Mining service not bound yet; queueing start")
                pendingStart = Pair(configPath, fork)
            } else {
                service.startMiner(configPath, fork)
            }
        } catch (e: Exception) {
            Log.e(name, "Unable to prepare/start miner", e)
            EventBus.getDefault().post(StdoutEvent("Unable to start miner: ${e.message}"))
            EventBus.getDefault().post(MinerStopEvent())
        }
    }

    @ReactMethod
    fun stop() {
        pendingStart = null
        fileObserver.stopWatching()
        try {
            miningService?.stopMiner()
            xmrigAPIService?.stopSummaryUpdates()
        } catch (e: RemoteException) {
            Log.e(name, "Unable to stop miner", e)
        }
        EventBus.getDefault().post(MinerStopEvent())
    }

    @ReactMethod
    fun availableProcessors(promise: Promise) {
        try {
            promise.resolve(Runtime.getRuntime().availableProcessors())
        } catch (e: Exception) {
            promise.reject("availableProcessors", e)
        }
    }

    @ReactMethod
    fun getMinerStatus(promise: Promise) {
        promise.resolve(currentMinerStatus())
    }

    @ReactMethod
    fun probeTcp(host: String, port: Int, timeoutMs: Int, promise: Promise) {
        if (host.isBlank() || port !in 1..65535) {
            promise.reject("probeTcp", "Invalid host or port")
            return
        }

        val timeout = timeoutMs.coerceIn(250, 10000)
        Thread {
            val startedAt = SystemClock.elapsedRealtime()
            try {
                val resolved = InetAddress.getAllByName(host).toList()
                val ipv4 = resolved.filterIsInstance<Inet4Address>()
                val candidates = if (ipv4.isNotEmpty()) ipv4 else resolved
                if (candidates.isEmpty()) {
                    throw IllegalStateException("No address resolved for $host")
                }

                var connected = false
                var lastError: Exception? = null
                val deadline = startedAt + timeout

                for (address in candidates) {
                    val remaining = (deadline - SystemClock.elapsedRealtime())
                        .coerceAtLeast(250L)
                        .coerceAtMost(timeout.toLong())
                        .toInt()
                    try {
                        Socket().use { socket ->
                            socket.connect(InetSocketAddress(address, port), remaining)
                        }
                        connected = true
                        break
                    } catch (e: Exception) {
                        lastError = e
                    }

                    if (SystemClock.elapsedRealtime() >= deadline) {
                        break
                    }
                }

                if (!connected) {
                    throw lastError ?: IllegalStateException("Unable to connect to $host:$port")
                }

                val payload = Arguments.createMap()
                payload.putBoolean("online", true)
                payload.putDouble(
                    "latencyMs",
                    (SystemClock.elapsedRealtime() - startedAt).toDouble(),
                )
                promise.resolve(payload)
            } catch (e: Exception) {
                Log.d(name, "TCP probe failed for $host:$port", e)
                val payload = Arguments.createMap()
                payload.putBoolean("online", false)
                payload.putNull("latencyMs")
                promise.resolve(payload)
            }
        }.start()
    }

    @ReactMethod
    fun pauseMiner() {
        try {
            xmrigAPIService?.pauseMiner()
        } catch (e: RemoteException) {
            Log.w(name, "Unable to pause miner", e)
        }
    }

    @ReactMethod
    fun resumeMiner() {
        try {
            xmrigAPIService?.resumeMiner()
        } catch (e: RemoteException) {
            Log.w(name, "Unable to resume miner", e)
        }
    }

    override fun getName(): String = "XMRigForAndroid"

    override fun initialize() {
        super.initialize()
        if (!EventBus.getDefault().isRegistered(this)) {
            EventBus.getDefault().register(this)
        }
        if (!batteryReceiverRegistered) {
            try {
                reactApplicationContext.applicationContext.registerReceiver(
                    batteryReceiver,
                    IntentFilter(Intent.ACTION_BATTERY_CHANGED),
                )
                batteryReceiverRegistered = true
            } catch (e: Exception) {
                Log.w(name, "Unable to register battery receiver", e)
            }
        }
    }

    override fun onCatalystInstanceDestroy() {
        pendingStart = null
        fileObserver.stopWatching()
        if (batteryReceiverRegistered) {
            try {
                reactApplicationContext.applicationContext.unregisterReceiver(batteryReceiver)
            } catch (e: Exception) {
                Log.w(name, "Unable to unregister battery receiver", e)
            }
            batteryReceiverRegistered = false
        }
        if (EventBus.getDefault().isRegistered(this)) {
            EventBus.getDefault().unregister(this)
        }
        super.onCatalystInstanceDestroy()
    }

    @ReactMethod
    fun addListener(eventName: String?) {
        if (eventName == "onPower") {
            val batteryStatus = reactApplicationContext.applicationContext.registerReceiver(
                null,
                IntentFilter(Intent.ACTION_BATTERY_CHANGED),
            )
            if (batteryStatus != null) {
                publishBatteryIntent(batteryStatus)
            }
        } else if (eventName == "onStatusChange") {
            // NativeEventEmitter listeners can be recreated when tabs/screens mount.
            // Publish the current process state so JS cannot remain stuck on "Stopped".
            emitMinerStatus()
        }
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
        // Required by React Native's NativeEventEmitter contract.
    }
}
