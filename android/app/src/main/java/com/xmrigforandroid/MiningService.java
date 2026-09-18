package com.xmrigforandroid;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import com.xmrigforandroid.data.serialization.XMRigFork;
import com.xmrigforandroid.events.MinerStartEvent;
import com.xmrigforandroid.events.MinerStopEvent;
import com.xmrigforandroid.events.StdoutEvent;
import com.xmrigforandroid.utils.ProcessExitDetector;

import org.greenrobot.eventbus.EventBus;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MiningService extends Service {

    private static final String LOG_TAG = "MiningSvc";
    private static final String NOTIFICATION_CHANNEL_ID = "com.xmrigforandroid.service";
    private static final String NOTIFICATION_CHANNEL_NAME = "XMRig Service";
    private static final int NOTIFICATION_ID = 200;

    private Notification.Builder notificationBuilder;
    private Process process;
    private OutputReaderThread outputHandler;
    private PowerManager.WakeLock wakeLock;

    private final String ansiRegex = "\\e\\[[\\d;]*[^\\d;]";
    private final Pattern ansiRegexPattern = Pattern.compile(ansiRegex);

    @Override
    public void onCreate() {
        super.onCreate();

        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationManager notificationManager =
                (NotificationManager) getApplication().getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
        );
        notificationManager.createNotificationChannel(channel);

        notificationBuilder = new Notification.Builder(this, NOTIFICATION_CHANNEL_ID)
                .setContentTitle("XMRig Continued")
                .setContentText("Miner service ready")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .setTicker("XMRig Continued")
                .setOngoing(true)
                .setOnlyAlertOnce(true);

        startForeground(NOTIFICATION_ID, notificationBuilder.build());
    }

    public class MiningServiceBinder extends Binder {
        public MiningService getService() {
            return MiningService.this;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    private final IMiningService.Stub binder = new IMiningService.Stub() {
        @Override
        public void startMiner(String configPath, String xmrigFork) {
            startMining(configPath, xmrigFork);
        }

        @Override
        public void stopMiner() {
            stopMining();
        }

        @Override
        public boolean isMinerRunning() {
            return isMiningProcessAlive();
        }
    };

    @Override
    public void onDestroy() {
        stopMining();
        super.onDestroy();
    }

    private void acquireWakeLock() {
        if (wakeLock == null) {
            PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
            wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "XMRigForAndroid::MinerWakeLock"
            );
            wakeLock.setReferenceCounted(false);
        }
        if (!wakeLock.isHeld()) {
            wakeLock.acquire();
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    private synchronized boolean isMiningProcessAlive() {
        if (process == null) {
            return false;
        }

        try {
            process.exitValue();
            return false;
        } catch (IllegalThreadStateException ignored) {
            return true;
        }
    }

    public synchronized void stopMining() {
        OutputReaderThread oldOutputHandler = outputHandler;
        outputHandler = null;
        if (oldOutputHandler != null) {
            oldOutputHandler.interrupt();
        }

        Process oldProcess = process;
        process = null;
        if (oldProcess != null) {
            oldProcess.destroy();
            Log.i(LOG_TAG, "stopped");
        }

        releaseWakeLock();
        setNotificationText("Miner stopped");
    }

    public synchronized void startMining(String configPath, String xmrigFork) {
        // Fully retire the previous process before starting another one. This also
        // keeps the old ProcessExitDetector from changing the state of the new run.
        stopMining();

        String xmrigBin = xmrigFork.equals(XMRigFork.MONEROOCEAN.toString())
                ? "libxmrig-mo.so"
                : "libxmrig.so";
        File minerBinary = new File(getApplicationInfo().nativeLibraryDir, xmrigBin);

        Log.i(LOG_TAG, "starting " + minerBinary.getAbsolutePath());

        try {
            if (!minerBinary.isFile()) {
                throw new IOException("Miner binary not found: " + minerBinary.getAbsolutePath());
            }

            acquireWakeLock();

            String[] args = {
                    minerBinary.getAbsolutePath(),
                    "-c", configPath,
                    "--http-host=127.0.0.1",
                    "--http-port=50080",
                    "--http-access-token=XMRigForAndroid",
                    "--http-no-restricted"
            };
            ProcessBuilder pb = new ProcessBuilder(args);
            pb.redirectErrorStream(true);

            final Process startedProcess = pb.start();
            process = startedProcess;

            final OutputReaderThread startedOutputHandler =
                    new OutputReaderThread(startedProcess.getInputStream());
            outputHandler = startedOutputHandler;
            startedOutputHandler.start();

            ProcessExitDetector processExitDetector = new ProcessExitDetector(startedProcess);
            processExitDetector.addProcessListener(finishedProcess -> {
                boolean currentProcessExited;
                synchronized (MiningService.this) {
                    currentProcessExited = process == finishedProcess;
                    if (currentProcessExited) {
                        process = null;
                        if (outputHandler == startedOutputHandler) {
                            outputHandler = null;
                        }
                        releaseWakeLock();
                    }
                }

                if (currentProcessExited) {
                    setNotificationText("Miner stopped");
                    EventBus.getDefault().post(new MinerStopEvent());
                }
            });
            processExitDetector.start();

            setNotificationText("Miner running");
            EventBus.getDefault().post(new MinerStartEvent());
        } catch (Exception e) {
            Log.e(LOG_TAG, "Unable to start miner", e);
            process = null;
            outputHandler = null;
            releaseWakeLock();
            setNotificationText("Miner failed to start");
            EventBus.getDefault().post(new StdoutEvent("Unable to start miner: " + e.getMessage()));
            EventBus.getDefault().post(new MinerStopEvent());
        }
    }

    private void setNotificationText(String text) {
        if (notificationBuilder == null) {
            return;
        }
        notificationBuilder.setContentText(text);
        NotificationManager notificationManager =
                (NotificationManager) getApplication().getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.notify(NOTIFICATION_ID, notificationBuilder.build());
    }

    public void updateNotification(String str) {
        Matcher matcher = ansiRegexPattern.matcher(str);
        setNotificationText(matcher.replaceAll(""));
    }

    private class OutputReaderThread extends Thread {
        private final InputStream inputStream;

        OutputReaderThread(InputStream inputStream) {
            this.inputStream = inputStream;
        }

        public void run() {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
                String line;
                while (!isInterrupted() && (line = reader.readLine()) != null) {
                    updateNotification(line);
                    EventBus.getDefault().post(new StdoutEvent(line));
                    Log.d(LOG_TAG, line);
                }
            } catch (IOException e) {
                if (!isInterrupted()) {
                    Log.w(LOG_TAG, "miner output stream closed unexpectedly", e);
                }
            }
        }
    }
}
