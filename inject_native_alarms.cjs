const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard/Dashboard.jsx', 'utf8');

// 1. Add AlarmPlugin import
c = c.replace(
  'import { Capacitor } from \'@capacitor/core\';\r\nimport { LocalNotifications } from \'@capacitor/local-notifications\';',
  'import { Capacitor, registerPlugin } from \'@capacitor/core\';\r\nimport { LocalNotifications } from \'@capacitor/local-notifications\';\r\n\r\nconst AlarmPlugin = registerPlugin(\'AlarmPlugin\');'
);

// 2. Schedule native alarms when todos load
let nativeAlarmLogic = `
  // Sync native alarms for Android
  useEffect(() => {
    if (Capacitor.isNativePlatform() && AlarmPlugin) {
      todos.forEach(todo => {
        if (!todo.completed && todo.hasAlarm && todo.time) {
          const todoDate = todo.dueDate ? parseISO(todo.dueDate) : parseISO(todo.createdAt);
          const [hours, minutes] = todo.time.split(':').map(Number);
          const targetDate = new Date(todoDate);
          targetDate.setHours(hours, minutes, 0, 0);
          
          if (todo.alarmOffset) {
            targetDate.setMinutes(targetDate.getMinutes() - todo.alarmOffset);
          }
          
          if (targetDate.getTime() > Date.now()) {
            AlarmPlugin.setAlarm({ 
              time: targetDate.getTime(),
              message: todo.alarmMessage || todo.text || 'Todo Alarm'
            }).catch(e => console.log('Failed to set native alarm', e));
          }
        }
      });
    }
  }, [todos]);
  
  // Alarm Check Logic`;

c = c.replace('  // Alarm Check Logic', nativeAlarmLogic);

fs.writeFileSync('src/components/Dashboard/Dashboard.jsx', c);
