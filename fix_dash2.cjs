const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard/Dashboard.jsx', 'utf8');

c = c.replace(/const \[showOverdue, setShowOverdue\] = useState\(false\)/, 'const [showOverdue, setShowOverdue] = useState(false)\n  const [missingPermissions, setMissingPermissions] = useState(false);');

c = c.replace(/\/\/ Alarm Check Logic\r?\n\s*useEffect\(\(\) => \{/, '// Alarm Check Logic\n  useEffect(() => {\n    if (Capacitor.isNativePlatform() && AlarmPlugin) {\n      AlarmPlugin.checkPermissions().then(perms => {\n        if (!perms.canScheduleExactAlarms || !perms.canDrawOverlays || !perms.canUseFullScreenIntent) {\n          setMissingPermissions(true);\n        }\n      }).catch(console.error);\n    }');

c = c.replace(/const triggerAlarm = \(todo\) => \{/, 'const requestNativePermissions = async () => {\n    try {\n      await AlarmPlugin.openAppSettings();\n      setMissingPermissions(false);\n    } catch (e) {\n      console.error(e);\n      alert(\'Failed to open settings: \' + (e.message || e));\n    }\n  };\n\n  const triggerAlarm = (todo) => {');

c = c.replace(/<Navbar \/>/, '<Navbar />\n              {Capacitor.isNativePlatform() && missingPermissions && (\n                <button\n                  onClick={requestNativePermissions}\n                  className="flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-lg transition-colors mt-1 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"\n                >\n                  <AlertTriangle size={14} />\n                  Fix Alarms\n                </button>\n              )}');

fs.writeFileSync('src/components/Dashboard/Dashboard.jsx', c);
