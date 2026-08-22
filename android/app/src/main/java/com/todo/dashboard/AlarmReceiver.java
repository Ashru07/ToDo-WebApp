package com.todo.dashboard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("AlarmReceiver", "Alarm Triggered!");

        // 1. Acquire WakeLock
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = pm.newWakeLock(
            PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
            "todoapp:AlarmWakeLock"
        );
        wakeLock.acquire(10000); 

        String message = "Your alarm is ringing!";
        if (intent.hasExtra("message")) {
            message = intent.getStringExtra("message");
        }
        
        String ringtone = "bell";
        if (intent.hasExtra("ringtone")) {
            ringtone = intent.getStringExtra("ringtone");
        }
        
        String todoId = "";
        if (intent.hasExtra("todoId")) {
            todoId = intent.getStringExtra("todoId");
        }
        
        // 2. Prepare Intent for MainActivity
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setAction(Intent.ACTION_VIEW);
        launchIntent.setData(android.net.Uri.parse("todoapp://alarm?message=" + android.net.Uri.encode(message) + "&ringtone=" + android.net.Uri.encode(ringtone) + "&todoId=" + android.net.Uri.encode(todoId)));
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        
        // 3. Fallback: Full-Screen Intent Notification
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        String channelId = "todo_alarm_channel_silent";
        
        if ("custom".equals(ringtone)) {
            channelId = "todo_alarm_channel_sound";
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                channelId,
                "High Priority Alarms",
                NotificationManager.IMPORTANCE_HIGH
            );
            if ("todo_alarm_channel_silent".equals(channelId)) {
                channel.setSound(null, null);
            } else {
                // Use default alarm sound
                channel.setSound(android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM), 
                  new android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_ALARM).build());
            }
            channel.setBypassDnd(true);
            notificationManager.createNotificationChannel(channel);
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, launchIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("Todo Alarm!")
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setFullScreenIntent(pendingIntent, true) // TRUE forces it to wake screen if OS allows
            .setAutoCancel(true)
            .setTimeoutAfter(60000);
            
        if ("todo_alarm_channel_silent".equals(channelId)) {
            builder.setSound(null);
        } else {
            builder.setSound(android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM));
        }

        notificationManager.notify(999, builder.build());

        // 4. Force Start Activity (Bypasses notification if permissions allow)
        try {
            context.startActivity(launchIntent);
        } catch (Exception e) {
            Log.e("AlarmReceiver", "Failed to start activity in background", e);
        }
    }
}
