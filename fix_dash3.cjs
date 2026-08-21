const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard/Dashboard.jsx', 'utf8');

c = c.replace(
  'import { Capacitor } from \'@capacitor/core\';\r\nimport { LocalNotifications } from \'@capacitor/local-notifications\';',
  'import { Capacitor, registerPlugin } from \'@capacitor/core\';\r\nimport { LocalNotifications } from \'@capacitor/local-notifications\';\r\n\r\nconst AlarmPlugin = registerPlugin(\'AlarmPlugin\');'
);

c = c.replace(
  'const [showOverdue, setShowOverdue] = useState(false)',
  'const [showOverdue, setShowOverdue] = useState(false)\r\n  const [missingPermissions, setMissingPermissions] = useState(false);'
);

let hook = `
  // Alarm Check Logic
  useEffect(() => {
    if (Capacitor.isNativePlatform() && AlarmPlugin) {
      AlarmPlugin.checkPermissions().then(perms => {
        if (!perms.canScheduleExactAlarms || !perms.canDrawOverlays || !perms.canUseFullScreenIntent) {
          setMissingPermissions(true);
        }
      }).catch(console.error);
    }
`;
c = c.replace('  // Alarm Check Logic\r\n  useEffect(() => {', hook);

let requestFunc = `
  const requestNativePermissions = async () => {
    try {
      await AlarmPlugin.openAppSettings();
      setMissingPermissions(false);
    } catch (e) {
      console.error(e);
      alert('Failed to open settings: ' + (e.message || e));
    }
  };
`;
c = c.replace('  const triggerAlarm = (todo) => {', requestFunc + '\r\n  const triggerAlarm = (todo) => {');

let buttonHTML = `
              <Navbar />
              {Capacitor.isNativePlatform() && missingPermissions && (
                <button
                  onClick={requestNativePermissions}
                  className="flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-lg transition-colors mt-1 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                >
                  <AlertTriangle size={14} />
                  Fix Alarms
                </button>
              )}
`;
c = c.replace('<Navbar />', buttonHTML);

fs.writeFileSync('src/components/Dashboard/Dashboard.jsx', c);
