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

  /** Opaque dark chrome matching tokens.bg.app — no white gesture-nav / window strip. */
  private void applyOpaqueSystemBars() {
    Window window = getWindow();
    final int chrome = Color.parseColor("#FF0F1115");
    window.setStatusBarColor(chrome);
    window.setNavigationBarColor(chrome);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      View decor = window.getDecorView();
      int flags = decor.getSystemUiVisibility();
      // Dark bars → clear light-* flags so icons stay light.
      flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
      }
      decor.setSystemUiVisibility(flags);
    }
  }
}
