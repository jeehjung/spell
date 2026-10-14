package com.jeehjung.spell;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;
import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 2401;
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private Uri cameraPhotoUri;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        webView.setWebViewClient(new WebViewClient() {
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                if (params.isCaptureEnabled() && launchCamera()) return true;
                Intent pickImage = new Intent(Intent.ACTION_GET_CONTENT);
                pickImage.addCategory(Intent.CATEGORY_OPENABLE);
                pickImage.setType("image/*");
                try {
                    startActivityForResult(Intent.createChooser(pickImage, "이미지 선택"), FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception e) {
                    finishFileSelection(null);
                    return false;
                }
            }
        });
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }

    private boolean launchCamera() {
        Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (camera.resolveActivity(getPackageManager()) == null) return false;
        try {
            File imageDir = new File(getCacheDir(), "images");
            if (!imageDir.exists() && !imageDir.mkdirs()) return false;
            String stamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
            File photo = File.createTempFile("SPELL_" + stamp + "_", ".jpg", imageDir);
            cameraPhotoUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", photo);
            camera.putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri);
            camera.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            camera.setClipData(android.content.ClipData.newRawUri("camera_photo", cameraPhotoUri));
            startActivityForResult(camera, FILE_CHOOSER_REQUEST);
            return true;
        } catch (IOException | RuntimeException e) {
            cameraPhotoUri = null;
            return false;
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST) return;
        Uri[] results = null;
        if (resultCode == RESULT_OK) {
            if (cameraPhotoUri != null) {
                results = new Uri[]{cameraPhotoUri};
            } else if (data != null && data.getData() != null) {
                results = new Uri[]{data.getData()};
            }
        }
        finishFileSelection(results);
        cameraPhotoUri = null;
    }

    private void finishFileSelection(Uri[] results) {
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        finishFileSelection(null);
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
