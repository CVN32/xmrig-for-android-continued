package com.xmrigforandroid;

import com.facebook.react.ReactActivity;


import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import org.devio.rn.splashscreen.SplashScreen;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "XMRigForAndroid";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    SplashScreen.show(this);  // here
    super.onCreate(null);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    applyOpaqueSystemBars();
    requestNotificationPermissionIfNeeded();

    IntentFilter batterFilters = new IntentFilter();
    batterFilters.addAction(Intent.ACTION_BATTERY_CHANGED);
    batterFilters.addAction(Intent.ACTION_BATTERY_LOW);
    batterFilters.addAction(Intent.ACTION_BATTERY_OKAY);
    batterFilters.addAction(Intent.ACTION_POWER_CONNECTED);
    batterFilters.addAction(Intent.ACTION_POWER_DISCONNECTED);
    PowerMonitorReceiver powerReceiver = new PowerMonitorReceiver();
    // API 33+ requires RECEIVER_NOT_EXPORTED (0x4). Reflect so compileSdk 31 still builds.
    if (Build.VERSION.SDK_INT >= 33) {
      try {
        getClass()
            .getMethod(
                "registerReceiver",
                android.content.BroadcastReceiver.class,
                IntentFilter.class,
                int.class)
            .invoke(this, powerReceiver, batterFilters, 0x4);
      } catch (Exception e) {
        registerReceiver(powerReceiver, batterFilters);
      }
    } else {
      registerReceiver(powerReceiver, batterFilters);
    }
  }

  /** Opaque light chrome so content is not drawn under translucent bars (invisible UI on Android 12+). */
  private void applyOpaqueSystemBars() {
    Window window = getWindow();
    final int chrome = Color.parseColor("#FFF5F5F5");
    window.setStatusBarColor(chrome);
    window.setNavigationBarColor(chrome);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      View decor = window.getDecorView();
      int flags = decor.getSystemUiVisibility();
      flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      decor.setSystemUiVisibility(flags);
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      View decor = window.getDecorView();
      int flags = decor.getSystemUiVisibility();
      flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
      decor.setSystemUiVisibility(flags);
    }
  }

  /** Best-effort POST_NOTIFICATIONS request on API 33+; safe no-op if denied.
   *  String constant (not Manifest.permission.*) so compileSdk 31 still builds. */
  private void requestNotificationPermissionIfNeeded() {
    if (Build.VERSION.SDK_INT < 33) {
      return;
    }
    try {
      final String postNotifications = "android.permission.POST_NOTIFICATIONS";
      if (checkSelfPermission(postNotifications) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
        requestPermissions(new String[]{postNotifications}, 1001);
      }
    } catch (Exception ignored) {
      // Keep launch resilient if permission APIs are unavailable.
    }
  }
}
