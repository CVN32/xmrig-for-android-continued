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
    registerReceiver(new PowerMonitorReceiver(), batterFilters);
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
}
