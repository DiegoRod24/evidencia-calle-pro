package pe.oneshot.evidence;

import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "OneShotShare")
public class OneShotSharePlugin extends Plugin {
  private byte[] bytes(PluginCall call) {
    String base64 = call.getString("base64", "");
    if (base64.contains(",")) base64 = base64.substring(base64.indexOf(",") + 1);
    return Base64.decode(base64, Base64.DEFAULT);
  }

  private File cacheFile(PluginCall call) throws Exception {
    String filename = call.getString("filename", "oneshot_archivo");
    File dir = new File(getContext().getCacheDir(), "oneshot-share");
    if (!dir.exists()) dir.mkdirs();
    File f = new File(dir, filename);
    FileOutputStream fos = new FileOutputStream(f);
    fos.write(bytes(call)); fos.close();
    return f;
  }

  private void saveToDownloads(PluginCall call) {
    try {
      String filename = call.getString("filename", "oneshot_archivo");
      String mime = call.getString("mimeType", "application/octet-stream");
      Uri uri;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ContentValues v = new ContentValues();
        v.put(MediaStore.Downloads.DISPLAY_NAME, filename);
        v.put(MediaStore.Downloads.MIME_TYPE, mime);
        v.put(MediaStore.Downloads.IS_PENDING, 1);
        uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
        if (uri == null) throw new Exception("MediaStore no devolvió URI");
        OutputStream os = getContext().getContentResolver().openOutputStream(uri);
        if (os == null) throw new Exception("No se pudo abrir destino");
        os.write(bytes(call)); os.close();
        v.clear(); v.put(MediaStore.Downloads.IS_PENDING, 0);
        getContext().getContentResolver().update(uri, v, null, null);
      } else {
        File dir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);
        if (!dir.exists()) dir.mkdirs();
        File f = new File(dir, filename);
        FileOutputStream fos = new FileOutputStream(f); fos.write(bytes(call)); fos.close();
        uri = Uri.fromFile(f);
      }
      JSObject ret = new JSObject(); ret.put("ok", true); ret.put("uri", uri.toString()); call.resolve(ret);
    } catch (Exception e) { call.reject("No se pudo guardar: " + e.getMessage(), e); }
  }

  private void shareFile(PluginCall call) {
    try {
      File f = cacheFile(call);
      Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
      Intent i = new Intent(Intent.ACTION_SEND);
      i.setType(call.getString("mimeType", "application/octet-stream"));
      i.putExtra(Intent.EXTRA_STREAM, uri);
      i.putExtra(Intent.EXTRA_TEXT, call.getString("message", "ONE SHOT"));
      i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      String phone = call.getString("phone", "");
      if (phone != null && phone.length() > 0) i.putExtra("jid", phone + "@s.whatsapp.net");
      i.setPackage("com.whatsapp");
      try { getActivity().startActivity(i); }
      catch (Exception e) { i.setPackage(null); getActivity().startActivity(Intent.createChooser(i, "Compartir ONE SHOT")); }
      JSObject ret = new JSObject(); ret.put("ok", true); call.resolve(ret);
    } catch (Exception e) { call.reject("No se pudo compartir: " + e.getMessage(), e); }
  }

  @PluginMethod public void saveFileToDownloads(PluginCall call) { saveToDownloads(call); }
  @PluginMethod public void shareFileToWhatsApp(PluginCall call) { shareFile(call); }



  @PluginMethod public void installApkUpdate(PluginCall call) {
    String sourceUrl = call.getString("url", "");
    String filename = call.getString("filename", "ONE_SHOT_update.apk");
    if (sourceUrl == null || sourceUrl.trim().isEmpty()) { call.reject("Falta la URL del APK"); return; }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getContext().getPackageManager().canRequestPackageInstalls()) {
      try {
        Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
        getActivity().startActivity(settings);
        call.reject("Autoriza 'Instalar apps desconocidas' para ONE SHOT y vuelve a tocar Actualizar.");
      } catch (Exception e) { call.reject("No se pudo abrir el permiso de instalación: " + e.getMessage(), e); }
      return;
    }
    new Thread(() -> {
      HttpURLConnection conn = null;
      try {
        File dir = new File(getContext().getCacheDir(), "oneshot-share"); if (!dir.exists()) dir.mkdirs();
        File apk = new File(dir, filename.endsWith(".apk") ? filename : filename + ".apk");
        URL u = new URL(sourceUrl); conn = (HttpURLConnection) u.openConnection(); conn.setConnectTimeout(20000); conn.setReadTimeout(60000); conn.setInstanceFollowRedirects(true); conn.connect();
        int code = conn.getResponseCode(); if (code < 200 || code >= 300) throw new Exception("HTTP " + code);
        InputStream in = conn.getInputStream(); FileOutputStream out = new FileOutputStream(apk); byte[] buffer = new byte[32768]; int n; while ((n = in.read(buffer)) > 0) out.write(buffer, 0, n); out.flush(); out.close(); in.close();
        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
        getActivity().runOnUiThread(() -> {
          try {
            Intent intent = new Intent(Intent.ACTION_VIEW); intent.setDataAndType(uri, "application/vnd.android.package-archive"); intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK); getActivity().startActivity(intent);
            JSObject ret = new JSObject(); ret.put("ok", true); ret.put("path", apk.getName()); call.resolve(ret);
          } catch (Exception e) { call.reject("No se pudo abrir el instalador: " + e.getMessage(), e); }
        });
      } catch (Exception e) { call.reject("No se pudo descargar el APK: " + e.getMessage(), e); }
      finally { if (conn != null) conn.disconnect(); }
    }).start();
  }

  // Compatibilidad con la versión anterior.
  @PluginMethod public void saveExcelToDownloads(PluginCall call) { saveToDownloads(call); }
  @PluginMethod public void shareExcelToWhatsApp(PluginCall call) { shareFile(call); }
}
