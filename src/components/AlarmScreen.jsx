import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

export default function AlarmScreen() {
  const AlarmPlugin = registerPlugin('AlarmPlugin');
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message || "It's time to check your tasks.";
  const [audioCtx, setAudioCtx] = useState(null);
  const [oscillator, setOscillator] = useState(null);

  useEffect(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioCtx(ctx);
      
      // Resume context in case it was suspended by browser policy
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Create a pulsing beep effect
      for (let i = 0; i < 40; i++) {
        gainNode.gain.setValueAtTime(1, ctx.currentTime + i * 0.5);
        gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.5 + 0.25);
      }

      osc.start();
      setOscillator(osc);

      return () => {
        try { osc.stop(); } catch (e) {}
        try { ctx.close(); } catch (e) {}
      };
    } catch (e) {
      console.log('Web Audio API failed', e);
    }
  }, []);

  const stopAlarm = async () => {
    if (oscillator) {
      try { oscillator.stop(); } catch (e) {}
    }
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
    }
    
    if (Capacitor.isNativePlatform()) {
      try {
        
        if (AlarmPlugin) await AlarmPlugin.stopAlarm();
      } catch (e) {
        console.error('Failed to clear native alarm notification', e);
      }
      // Exit app if we just woke it up to show alarm
      await CapacitorApp.exitApp();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center animate-bounce mb-8 shadow-2xl shadow-red-500/50">
        <Bell size={64} className="text-white animate-pulse" />
      </div>
      
      <h1 className="text-4xl font-bold text-white mb-4">Todo Alarm!</h1>
      <p className="text-xl text-slate-300 mb-12">{message}</p>

      <button
        onClick={stopAlarm}
        className="w-full max-w-sm py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-2xl font-bold transition-all shadow-xl shadow-red-600/30 active:scale-95"
      >
        STOP ALARM
      </button>
    </div>
  );
}
