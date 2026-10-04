package ir.alfba.bazaarbilling;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;

import androidx.appcompat.app.AppCompatActivity;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

import ir.cafebazaar.poolakey.Connection;
import ir.cafebazaar.poolakey.Payment;
import ir.cafebazaar.poolakey.config.PaymentConfiguration;
import ir.cafebazaar.poolakey.config.SecurityCheck;
import ir.cafebazaar.poolakey.entity.PurchaseInfo;
import ir.cafebazaar.poolakey.request.PurchaseRequest;
import kotlin.Unit;

/**
 * پل بین وب‌ویو (کاپازیتور) و SDK رسمی پرداخت کافه‌بازار (Poolakey).
 * JS: registerPlugin('BazaarBilling')
 */
@CapacitorPlugin(name = "BazaarBilling")
public class BazaarBillingPlugin extends Plugin {

    private static final String BAZAAR_PACKAGE = "com.farsitel.bazaar";

    private Payment payment;
    private Connection connection;
    private volatile boolean connected = false;
    private boolean connecting = false;
    private int generation = 0;
    private final List<PluginCall> pendingConnect = new ArrayList<>();

    // ---------- connection ----------

    @PluginMethod
    public void connect(PluginCall call) {
        final String rsaKey = call.getString("rsaPublicKey");
        if (rsaKey == null || rsaKey.trim().isEmpty()) {
            call.reject("rsaPublicKey is required", "INVALID_ARGS");
            return;
        }
        if (connected) {
            JSObject ret = new JSObject();
            ret.put("connected", true);
            call.resolve(ret);
            return;
        }
        synchronized (pendingConnect) {
            pendingConnect.add(call);
            if (connecting) return;
            connecting = true;
        }
        final AppCompatActivity activity = getActivity();
        activity.runOnUiThread(() -> startConnection(activity, rsaKey.trim()));
    }

    private void startConnection(AppCompatActivity activity, String rsaKey) {
        try {
            final int gen = ++generation; // callbacks of an older connection are ignored
            if (connection != null) {
                try { connection.disconnect(); } catch (Exception ignored) { }
                connection = null;
            }
            SecurityCheck securityCheck = new SecurityCheck.Enable(rsaKey);
            PaymentConfiguration config = new PaymentConfiguration(securityCheck);
            payment = new Payment(activity, config);
            connection = payment.connect(cb -> {
                cb.connectionSucceed(() -> {
                    if (gen != generation) return Unit.INSTANCE;
                    connected = true;
                    JSObject ret = new JSObject();
                    ret.put("connected", true);
                    flushConnect(ret, null);
                    return Unit.INSTANCE;
                });
                cb.connectionFailed(t -> {
                    if (gen != generation) return Unit.INSTANCE;
                    connected = false;
                    flushConnect(null, t);
                    return Unit.INSTANCE;
                });
                cb.disconnected(() -> {
                    if (gen != generation) return Unit.INSTANCE;
                    connected = false;
                    flushConnect(null, new IllegalStateException("Disconnected from Bazaar"));
                    return Unit.INSTANCE;
                });
                return Unit.INSTANCE;
            });
        } catch (Exception e) {
            connected = false;
            flushConnect(null, e);
        }
    }

    private void flushConnect(JSObject ok, Throwable error) {
        List<PluginCall> calls;
        synchronized (pendingConnect) {
            calls = new ArrayList<>(pendingConnect);
            pendingConnect.clear();
            connecting = false;
        }
        for (PluginCall c : calls) {
            if (ok != null) c.resolve(ok);
            else rejectWith(c, error);
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        doDisconnect();
        call.resolve();
    }

    private void doDisconnect() {
        generation++;
        connected = false;
        if (connection != null) {
            try { connection.disconnect(); } catch (Exception ignored) { }
            connection = null;
        }
        flushConnect(null, new IllegalStateException("Disconnected from Bazaar"));
    }

    // ---------- purchase ----------

    @PluginMethod
    public void purchase(PluginCall call) {
        final String productId = call.getString("productId");
        final String payload = call.getString("payload", "");
        if (productId == null || productId.isEmpty()) {
            call.reject("productId is required", "INVALID_ARGS");
            return;
        }
        if (!connected || payment == null) {
            call.reject("Not connected to Bazaar", "NOT_CONNECTED");
            return;
        }
        final AppCompatActivity activity = getActivity();
        activity.runOnUiThread(() -> {
            try {
                payment.purchaseProduct(
                    activity.getActivityResultRegistry(),
                    new PurchaseRequest(productId, payload, null),
                    cb -> {
                        cb.purchaseFlowBegan(() -> Unit.INSTANCE);
                        cb.failedToBeginFlow(t -> { rejectWith(call, t); return Unit.INSTANCE; });
                        cb.purchaseSucceed(info -> { call.resolve(toJs(info)); return Unit.INSTANCE; });
                        cb.purchaseCanceled(() -> { call.reject("Purchase canceled by user", "CANCELED"); return Unit.INSTANCE; });
                        cb.purchaseFailed(t -> { rejectWith(call, t); return Unit.INSTANCE; });
                        return Unit.INSTANCE;
                    }
                );
            } catch (Exception e) {
                rejectWith(call, e);
            }
        });
    }

    // ---------- query (restore) ----------

    @PluginMethod
    public void getPurchases(PluginCall call) {
        if (!connected || payment == null) {
            call.reject("Not connected to Bazaar", "NOT_CONNECTED");
            return;
        }
        try {
            payment.getPurchasedProducts(cb -> {
                cb.querySucceed(list -> {
                    JSArray arr = new JSArray();
                    for (PurchaseInfo p : list) arr.put(toJs(p));
                    JSObject ret = new JSObject();
                    ret.put("purchases", arr);
                    call.resolve(ret);
                    return Unit.INSTANCE;
                });
                cb.queryFailed(t -> { rejectWith(call, t); return Unit.INSTANCE; });
                return Unit.INSTANCE;
            });
        } catch (Exception e) {
            rejectWith(call, e);
        }
    }

    // ---------- helpers for UI ----------

    @PluginMethod
    public void isBazaarInstalled(PluginCall call) {
        boolean installed;
        try {
            getContext().getPackageManager().getPackageInfo(BAZAAR_PACKAGE, 0);
            installed = true;
        } catch (PackageManager.NameNotFoundException e) {
            installed = false;
        }
        JSObject ret = new JSObject();
        ret.put("installed", installed);
        call.resolve(ret);
    }

    /** صفحهٔ همین برنامه در بازار (برای نصب/به‌روزرسانی بازار یا نظر دادن) */
    @PluginMethod
    public void openAppPage(PluginCall call) {
        String pkg = getContext().getPackageName();
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("bazaar://details?id=" + pkg));
            i.setPackage(BAZAAR_PACKAGE);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("https://cafebazaar.ir/app/" + pkg));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        }
        call.resolve();
    }

    private JSObject toJs(PurchaseInfo p) {
        JSObject o = new JSObject();
        o.put("orderId", p.getOrderId());
        o.put("purchaseToken", p.getPurchaseToken());
        o.put("payload", p.getPayload());
        o.put("packageName", p.getPackageName());
        o.put("productId", p.getProductId());
        o.put("purchaseTime", p.getPurchaseTime());
        o.put("purchaseState", String.valueOf(p.getPurchaseState()));
        o.put("originalJson", p.getOriginalJson());
        o.put("dataSignature", p.getDataSignature());
        return o;
    }

    private void rejectWith(PluginCall call, Throwable t) {
        String name = t == null ? "Unknown" : t.getClass().getSimpleName();
        String code;
        switch (name) {
            case "BazaarNotFoundException": code = "BAZAAR_NOT_FOUND"; break;
            case "BazaarNotSupportedException": code = "BAZAAR_NOT_SUPPORTED"; break;
            case "IAPNotSupportedException": code = "IAP_NOT_SUPPORTED"; break;
            case "PurchaseHijackedException": code = "PURCHASE_HIJACKED"; break;
            case "DisconnectException": code = "DISCONNECTED"; break;
            case "ResultNotOkayException": code = "RESULT_NOT_OK"; break;
            default: code = "UNKNOWN";
        }
        JSObject data = new JSObject();
        data.put("exception", name);
        String msg = t != null && t.getMessage() != null ? t.getMessage() : name;
        call.reject(msg, code, (Exception) null, data);
    }

    @Override
    protected void handleOnDestroy() {
        doDisconnect();
        super.handleOnDestroy();
    }
}
