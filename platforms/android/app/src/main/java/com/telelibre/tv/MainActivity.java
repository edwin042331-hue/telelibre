package com.telelibre.tv;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.media.tv.TvContract;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
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

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;

/**
 * Contenedor de TeleLibre para Android TV / Google TV: carga la web empaquetada en assets/www
 * y le da lo que el WebView solo no tiene: botones del control (Atrás, canales, multimedia, colores, Menú…),
 * búsqueda por voz, la fila "Seguir viendo" de la pantalla de inicio de Google TV y el control de la pantalla.
 */
public class MainActivity extends Activity {

    private static final String TAG = "TeleLibre";
    private static final int VOICE_REQUEST = 42;
    // Búsqueda por voz de Google TV (la interfaz pensada para el control remoto).
    private static final String GOOGLE_TV_VOICE = "com.google.android.katniss";
    // El instalador de Android avisa el resultado abriendo la app con esta acción.
    private static final String ACTION_INSTALL_STATUS = "com.telelibre.tv.INSTALL_STATUS";

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
        if (ACTION_INSTALL_STATUS.equals(intent.getAction())) {
            onInstallStatus(intent);
            return;
        }
        setIntent(intent);
        if (takeDeepLink(intent)) js("window.__telelibreCheckOpen && window.__telelibreCheckOpen()");
    }

    // ---------- Actualización desde la propia TV ----------

    private void updateStatus(String state, int percent, String message) {
        js("window.__telelibreUpdate && window.__telelibreUpdate(" + JSONObject.quote(state) + "," + percent + ","
                + JSONObject.quote(message == null ? "" : message) + ")");
    }

    /** Descarga la APK, comprueba que esté firmada con la misma llave y se la pasa al instalador de Android. */
    private void downloadAndInstall(String url) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getPackageManager().canRequestPackageInstalls()) {
                // Primera vez: Android pide permitir que TeleLibre instale actualizaciones.
                updateStatus("permission", 0, null);
                runOnUiThread(() -> {
                    try {
                        startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
                    } catch (Exception e) {
                        Log.w(TAG, "No se pudo abrir el permiso de instalación: " + e);
                    }
                });
                return;
            }
            File apk = new File(getCacheDir(), "update.apk");
            HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setConnectTimeout(20000);
            conn.setReadTimeout(30000);
            long total = conn.getContentLength();
            long done = 0;
            int lastPercent = -1;
            try (InputStream in = conn.getInputStream(); OutputStream out = new FileOutputStream(apk)) {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) {
                    out.write(buf, 0, n);
                    done += n;
                    int percent = total > 0 ? (int) (done * 100 / total) : 0;
                    if (percent / 10 != lastPercent / 10) {
                        lastPercent = percent;
                        updateStatus("download", percent, null);
                    }
                }
            }
            if (!sameSigner(apk)) {
                apk.delete();
                updateStatus("error", 0, "la descarga no está firmada con la llave de TeleLibre");
                return;
            }
            PackageInstaller installer = getPackageManager().getPackageInstaller();
            PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
            params.setAppPackageName(getPackageName());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED);
            }
            int sessionId = installer.createSession(params);
            try (PackageInstaller.Session session = installer.openSession(sessionId)) {
                try (InputStream src = new FileInputStream(apk); OutputStream dst = session.openWrite("telelibre.apk", 0, apk.length())) {
                    byte[] buf = new byte[65536];
                    int n;
                    while ((n = src.read(buf)) > 0) dst.write(buf, 0, n);
                    session.fsync(dst);
                }
                // El resultado vuelve como Intent; debe ser mutable para que Android agregue el estado.
                Intent callback = new Intent(this, MainActivity.class).setAction(ACTION_INSTALL_STATUS);
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) flags |= PendingIntent.FLAG_MUTABLE;
                PendingIntent pending = PendingIntent.getActivity(this, sessionId, callback, flags);
                updateStatus("installing", 100, null);
                session.commit(pending.getIntentSender());
            }
        } catch (Exception e) {
            Log.w(TAG, "Actualización fallida: " + e);
            updateStatus("error", 0, e.getMessage());
        }
    }

    private void onInstallStatus(Intent intent) {
        int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            // Android muestra su pantalla de confirmación ("¿Quieres actualizar esta app?").
            Intent confirm = intent.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirm != null) startActivity(confirm);
        } else if (status != PackageInstaller.STATUS_SUCCESS) {
            updateStatus("error", 0, intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE));
        }
    }

    /** Solo se instala una APK firmada con la misma llave que la app actual. */
    private boolean sameSigner(File apk) {
        try {
            PackageManager pm = getPackageManager();
            int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
            PackageInfo update = pm.getPackageArchiveInfo(apk.getPath(), flags);
            PackageInfo current = pm.getPackageInfo(getPackageName(), flags);
            if (update == null || !getPackageName().equals(update.packageName)) return false;
            String[] a = signerHashes(update);
            String[] b = signerHashes(current);
            return a.length > 0 && Arrays.equals(a, b);
        } catch (Exception e) {
            Log.w(TAG, "No se pudo verificar la firma: " + e);
            return false;
        }
    }

    private static String[] signerHashes(PackageInfo info) throws Exception {
        Signature[] sigs;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            sigs = info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners();
        } else {
            sigs = info.signatures;
        }
        if (sigs == null) return new String[0];
        String[] out = new String[sigs.length];
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        for (int i = 0; i < sigs.length; i++) {
            byte[] d = sha.digest(sigs[i].toByteArray());
            StringBuilder hex = new StringBuilder();
            for (byte x : d) hex.append(String.format("%02X", x));
            out[i] = hex.toString();
        }
        Arrays.sort(out);
        return out;
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
                // Con varios reconocedores Android pregunta cuál usar: se va directo al de Google TV si está.
                Intent google = new Intent(i).setPackage(GOOGLE_TV_VOICE);
                if (!getPackageManager().queryIntentActivities(google, 0).isEmpty()) i = google;
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
        public void installUpdate(final String url) {
            new Thread(() -> downloadAndInstall(url)).start();
        }

        @JavascriptInterface
        public void setWatchNext(final String json) {
            new Thread(() -> writeWatchNext(json)).start();
        }
    }
}
