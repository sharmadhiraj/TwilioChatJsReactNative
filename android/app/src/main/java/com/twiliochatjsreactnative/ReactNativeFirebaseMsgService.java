package com.twiliochatjsreactnative;

import android.app.NotificationManager;
import android.app.NotificationChannel;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import androidx.core.app.NotificationCompat;
import android.util.Log;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.twiliochatjsreactnative.TwilioFCMNotificationPayload;

public class ReactNativeFirebaseMsgService extends FirebaseMessagingService {

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.i("ReactNativeFirebaseMsgService", "got new remote message");
        Bundle bundle = remoteMessageToBundle(remoteMessage);
        Intent i = new Intent("com.twiliochatjsreactnative.onFcmMessage");
        i.putExtras(bundle);
        sendBroadcast(i, null);

        // TwilioFCMNotificationPayload is a helper class to parser Twilio Notify's FCM notification
        // more info see here: https://www.twilio.com/
        displayPushInNotififcationArea(new TwilioFCMNotificationPayload(bundle));

//        if you want to send the raw push to the JS library to reparse
//        (while app is not running), you can use this react native pattern to call static JS method
//
//        Intent service = new Intent(getApplicationContext(), FCMParsePushService.class);
//        service.putExtras(bundle);
//        getApplicationContext().startService(service);
    }

    private void displayPushInNotififcationArea(TwilioFCMNotificationPayload notificationPayload) {
        Log.i("ReactNativeFirebaseMsgService", "Got notification to display: " + notificationPayload.toString());

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        String channelId = "TwilioChatJsReactNative_default_channel_id";
        String channelDescription = "TwilioChatJsReactNative Default Channel";
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel notificationChannel = notificationManager.getNotificationChannel(channelId);
            if (notificationChannel == null) {
                int importance = NotificationManager.IMPORTANCE_HIGH; //Set the importance level
                notificationChannel = new NotificationChannel(channelId, channelDescription, importance);
                notificationChannel.enableVibration(true); //Set if it is necesssary
                notificationManager.createNotificationChannel(notificationChannel);
            }
        }

        notificationManager.notify(0, new NotificationCompat.Builder(this)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("TwilioChatJSReactNative")
                .setContentText(notificationPayload.getBody())
                .setChannelId(channelId)
                .build());
    }

    private Bundle remoteMessageToBundle(RemoteMessage remoteMessage) {
        Bundle bundle = new Bundle();
        bundle.putString("collapse_key", remoteMessage.getCollapseKey());
        bundle.putString("from", remoteMessage.getFrom());
        bundle.putString("google.message_id", remoteMessage.getMessageId());
        bundle.putDouble("google.sent_time", remoteMessage.getSentTime());
        if (remoteMessage.getData() != null) {
            Bundle data = new Bundle();
            for (String key : remoteMessage.getData().keySet()) {
                data.putString(key, remoteMessage.getData().get(key));
            }
            bundle.putBundle("data", data);
        }
        return bundle;
    }
}
