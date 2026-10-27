package com.telelibre.tv;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

/**
 * Contenedor de TeleLibre para Android TV / Google TV: carga la web empaquetada en assets/www
 * y traduce los botones del control que el WebView no entrega (Atrás, canales, multimedia, colores).
 */
public class MainActivity extends Activity {

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0B0B10"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        // La app abre desde file://: con acceso universal las listas y streams no dependen de CORS,
        // y los canales http (contenido mixto) también se reproducen.
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " TeleLibreAndroidTV");

        web.setWebChromeClient(new WebChromeClient() {
            // Sin esto, Android muestra un ícono gris de "play" mientras carga cada video.
            @Override
            public Bitmap getDefaultVideoPoster() {
                return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
            }
        });
        web.addJavascriptInterface(new NativeBridge(), "TeleLibreNative");
        web.setFocusable(true);
        web.requestFocus();
        setContentView(web);
        web.loadUrl("file:///android_asset/www/index.html");
    }

    /** Botones que el WebView no convierte en keydown útiles; las flechas y OK sí llegan solos. */
    private static String actionFor(int keyCode) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_BACK: return "back";
            case KeyEvent.KEYCODE_CHANNEL_UP: return "chup";
            case KeyEvent.KEYCODE_CHANNEL_DOWN: return "chdown";
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_MEDIA_PLAY:
            case KeyEvent.KEYCODE_MEDIA_PAUSE: return "playpause";
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD: return "ff";
            case KeyEvent.KEYCODE_MEDIA_REWIND: return "rw";
            case KeyEvent.KEYCODE_MEDIA_STOP: return "stop";
            case KeyEvent.KEYCODE_PROG_RED: return "red";
            case KeyEvent.KEYCODE_PROG_GREEN: return "green";
            case KeyEvent.KEYCODE_PROG_YELLOW: return "yellow";
            case KeyEvent.KEYCODE_PROG_BLUE: return "blue";
            case KeyEvent.KEYCODE_MENU: return "menu";
            case KeyEvent.KEYCODE_GUIDE: return "guide";
            case KeyEvent.KEYCODE_INFO: return "info";
            case KeyEvent.KEYCODE_LAST_CHANNEL: return "recall";
            case KeyEvent.KEYCODE_TV: return "chlist";
            default: return null;
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        String action = actionFor(event.getKeyCode());
        if (action == null) return super.dispatchKeyEvent(event);
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            web.evaluateJavascript("window.__telelibreKey && window.__telelibreKey('" + action + "')", null);
        }
        return true;
    }

    @Override
    protected void onPause() {
        // Guardar el punto de la película antes de que Android congele la app (TV apagada o cambio de app).
        web.evaluateJavascript("window.__telelibreHidden && window.__telelibreHidden()", null);
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }

    private class NativeBridge {
        @JavascriptInterface
        public void exit() {
            runOnUiThread(MainActivity.this::finish);
        }
    }
}
