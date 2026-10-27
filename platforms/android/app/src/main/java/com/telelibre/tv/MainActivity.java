package com.telelibre.tv;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.media.tv.TvContract;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.util.Log;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

/**
 * Contenedor de TeleLibre para Android TV / Google TV: carga la web empaquetada en assets/www
 * y le da lo que el WebView solo no tiene: botones del control (Atrás, canales, multimedia, colores, Menú…),
 * búsqueda por voz, la fila "Seguir viendo" de la pantalla de inicio de Google TV y el control de la pantalla.
 */
public class MainActivity extends Activity {

    private static final String TAG = "TeleLibre";
    private static final int VOICE_REQUEST = 42;

    private WebView web;
    // Contenido pedido desde "Seguir viendo" de Google TV, esperando a que la app lo recoja.
    private volatile String pendingOpen = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
        takeDeepLink(getIntent());
        web.loadUrl("file:///android_asset/www/index.html");
    }

    // Google TV abre "telelibre://open?key=…" cuando se elige algo de la fila "Seguir viendo".
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (takeDeepLink(intent)) js("window.__telelibreCheckOpen && window.__telelibreCheckOpen()");
    }

    private boolean takeDeepLink(Intent intent) {
        Uri data = intent == null ? null : intent.getData();
        if (data == null || !"telelibre".equals(data.getScheme())) return false;
        pendingOpen = data.getQueryParameter("key");
        return pendingOpen != null;
    }

    private void js(final String code) {
        runOnUiThread(() -> web.evaluateJavascript(code, null));
    }

    /** Botones que el WebView no convierte en keydown útiles; las flechas, OK y números sí llegan solos. */
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
            case KeyEvent.KEYCODE_SEARCH: return "voice";
            default: return null;
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        String action = actionFor(event.getKeyCode());
        if (action == null) return super.dispatchKeyEvent(event);
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            js("window.__telelibreKey && window.__telelibreKey('" + action + "')");
        }
        return true;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != VOICE_REQUEST) {
            super.onActivityResult(requestCode, resultCode, data);
            return;
        }
        String text = null;
        if (resultCode == RESULT_OK && data != null) {
            ArrayList<String> results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (results != null && !results.isEmpty()) text = results.get(0);
        }
        voiceResult(text);
    }

    private void voiceResult(String text) {
        js("window.__telelibreVoice && window.__telelibreVoice(" + (text == null ? "null" : JSONObject.quote(text)) + ")");
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

    /**
     * Fila "Seguir viendo" de la pantalla de inicio de Google TV (TvProvider · Watch Next).
     * Se reemplaza entera cada vez: Android solo deja borrar las filas de esta app.
     */
    private void writeWatchNext(String json) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        try {
            ContentResolver cr = getContentResolver();
            cr.delete(TvContract.WatchNextPrograms.CONTENT_URI, null, null);
            JSONArray items = new JSONArray(json);
            for (int i = 0; i < items.length(); i++) {
                JSONObject o = items.getJSONObject(i);
                boolean episode = "episode".equals(o.optString("type"));
                ContentValues v = new ContentValues();
                v.put(TvContract.WatchNextPrograms.COLUMN_TYPE,
                        episode ? TvContract.WatchNextPrograms.TYPE_TV_EPISODE : TvContract.WatchNextPrograms.TYPE_MOVIE);
                v.put(TvContract.WatchNextPrograms.COLUMN_WATCH_NEXT_TYPE, TvContract.WatchNextPrograms.WATCH_NEXT_TYPE_CONTINUE);
                v.put(TvContract.WatchNextPrograms.COLUMN_TITLE, o.optString("title"));
                if (episode) v.put(TvContract.WatchNextPrograms.COLUMN_EPISODE_TITLE, o.optString("subtitle"));
                v.put(TvContract.WatchNextPrograms.COLUMN_POSTER_ART_URI, o.optString("poster"));
                v.put(TvContract.WatchNextPrograms.COLUMN_POSTER_ART_ASPECT_RATIO, TvContract.WatchNextPrograms.ASPECT_RATIO_2_3);
                v.put(TvContract.WatchNextPrograms.COLUMN_LAST_PLAYBACK_POSITION_MILLIS, o.optLong("position"));
                v.put(TvContract.WatchNextPrograms.COLUMN_DURATION_MILLIS, o.optLong("duration"));
                v.put(TvContract.WatchNextPrograms.COLUMN_LAST_ENGAGEMENT_TIME_UTC_MILLIS, o.optLong("at"));
                v.put(TvContract.WatchNextPrograms.COLUMN_INTERNAL_PROVIDER_ID, o.optString("key"));
                v.put(TvContract.WatchNextPrograms.COLUMN_INTENT_URI, "telelibre://open?key=" + Uri.encode(o.optString("key")));
                cr.insert(TvContract.WatchNextPrograms.CONTENT_URI, v);
            }
        } catch (Exception e) {
            Log.w(TAG, "No se pudo actualizar Seguir viendo: " + e);
        }
    }

    private class NativeBridge {
        @JavascriptInterface
        public void exit() {
            runOnUiThread(MainActivity.this::finish);
        }

        // Pantalla siempre encendida solo mientras se reproduce: en los menús vuelve el protector de pantalla.
        @JavascriptInterface
        public void keepScreenOn(final boolean on) {
            runOnUiThread(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface
        public boolean canListen() {
            return !getPackageManager().queryIntentActivities(new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH), 0).isEmpty();
        }

        // Abre el reconocedor de voz de Google; el texto vuelve por window.__telelibreVoice.
        @JavascriptInterface
        public void listen() {
            runOnUiThread(() -> {
                Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-419");
                i.putExtra(RecognizerIntent.EXTRA_PROMPT, "¿Qué quieres ver?");
                try {
                    startActivityForResult(i, VOICE_REQUEST);
                } catch (Exception e) {
                    Log.w(TAG, "Sin reconocimiento de voz: " + e);
                    voiceResult(null);
                }
            });
        }

        @JavascriptInterface
        public String takePendingOpen() {
            String key = pendingOpen;
            pendingOpen = null;
            return key == null ? "" : key;
        }

        @JavascriptInterface
        public void setWatchNext(final String json) {
            new Thread(() -> writeWatchNext(json)).start();
        }
    }
}
