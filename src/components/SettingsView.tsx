import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  AlertCircle,
  Save,
  RotateCcw,
  Code2,
  ServerOff,
  Download
} from 'lucide-react';
import { FirebaseConfigOptions, UserProfile, ExpenseRecord } from '../types';
import {
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  clearAllExpenses
} from '../lib/firebase';
import { exportMonthlyRecordsToCSV, getCurrentMonthKey } from '../lib/calculations';
import { Trash2 } from 'lucide-react';

interface SettingsViewProps {
  user: UserProfile | null;
  isFirebaseConnected: boolean;
  allRecords: ExpenseRecord[];
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  isFirebaseConnected,
  allRecords,
  onLogout,
}) => {
  const currentConfig = getActiveFirebaseConfig() || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  };

  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');

  const [jsonInput, setJsonInput] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /expenses/{date} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`;

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleParseJson = () => {
    try {
      // Clean JS object string to JSON if user copied from firebase console snippet
      let cleaned = jsonInput.trim();
      if (cleaned.startsWith('const firebaseConfig =')) {
        cleaned = cleaned.replace('const firebaseConfig =', '').replace(/;$/, '').trim();
      }
      // Simple regex parser for common JS object formats
      const parsed = JSON.parse(
        cleaned
          .replace(/([a-zA-Z0-9_]+):/g, '"$1":')
          .replace(/'/g, '"')
          .replace(/,\s*}/g, '}')
      );

      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);

      setSaveMessage('Firebase configuration successfully parsed from JSON!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      alert('Could not parse JSON. Please enter fields manually or check formatting.');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      alert('API Key and Project ID are required.');
      return;
    }

    const cfg: FirebaseConfigOptions = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveCustomFirebaseConfig(cfg);
    setSaveMessage('Firebase configuration saved! The application will now connect to your Firebase project.');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleResetToDefault = () => {
    if (confirm('Reset custom credentials and revert to local storage mode?')) {
      clearCustomFirebaseConfig();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            System Preferences
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Settings & Integrations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure your Firebase database, check connection status, and deploy to Netlify / Vercel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
              isFirebaseConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400'
            }`}
          >
            {isFirebaseConnected ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cloud Connected</span>
              </>
            ) : (
              <>
                <ServerOff className="w-4 h-4 text-amber-600" />
                <span>Local Mode (Demo)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Firebase Configuration Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Firebase Credentials Setup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your Firebase project details below or configure directly in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-600">firebase-config.js</code>
            </p>
          </div>
        </div>

        {/* Quick paste helper */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
            Quick Auto-Fill from Firebase SDK snippet:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder='Paste { apiKey: "...", projectId: "..." } or const firebaseConfig = {...}'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleParseJson}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white font-bold text-xs cursor-pointer"
            >
              Parse
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                API Key (apiKey) *
              </label>
              <input
                type="text"
                required
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project ID (projectId) *
              </label>
              <input
                type="text"
                required
                placeholder="messmate-app-123"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Auth Domain (authDomain)
              </label>
              <input
                type="text"
                placeholder="messmate-app-123.firebaseapp.com"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Storage Bucket
              </label>
              <input
                type="text"
                placeholder="messmate-app-123.appspot.com"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Messaging Sender ID
              </label>
              <input
                type="text"
                placeholder="123456789012"
                value={messagingSenderId}
                onChange={(e) => setMessagingSenderId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                App ID
              </label>
              <input
                type="text"
                placeholder="1:123456789012:web:abcdef"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default Config</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save & Connect Firebase</span>
            </button>
          </div>
        </form>
      </div>

      {/* Step-by-Step Setup Guide */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-amber-500" />
          <span>Simple 5-Step Firebase Setup Guide</span>
        </h3>

        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </span>
            <div>
              <strong className="text-slate-900 dark:text-white text-sm block">
                Create a Firebase Project
              </strong>
              <span>
                Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-600 underline">console.firebase.google.com</a> and click "Add project". Name it e.g. <code>messmate-expenses</code>.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </span>
            <div>
              <strong className="text-slate-900 dark:text-white text-sm block">
                Enable Email/Password Authentication
              </strong>
              <span>
                In Firebase Console, click <strong>Build &gt; Authentication &gt; Sign-in method</strong>, select <strong>Email/Password</strong>, and turn it ON.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </span>
            <div>
              <strong className="text-slate-900 dark:text-white text-sm block">
                Create Firestore Database
              </strong>
              <span>
                In Firebase Console, click <strong>Build &gt; Firestore Database</strong>, click <strong>Create database</strong> (choose Start in production mode), and select your nearest region.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              4
            </span>
            <div>
              <strong className="text-slate-900 dark:text-white text-sm block">
                Get Firebase Web App Config
              </strong>
              <span>
                Under Project Settings &gt; General &gt; Your apps &gt; Web (click &lt;/&gt;), register your app. Copy the credentials and paste them into the form above or into <code>firebase-config.js</code>.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              5
            </span>
            <div className="w-full">
              <strong className="text-slate-900 dark:text-white text-sm block">
                Add Firestore Security Rules
              </strong>
              <p className="mb-2">
                In Firestore Database &gt; Rules tab, replace the rules with the isolated user rules below:
              </p>
              <div className="relative bg-slate-900 text-amber-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                <pre>{sampleRules}</pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(sampleRules, 'rules')}
                  className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === 'rules' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === 'rules' ? 'Copied' : 'Copy Rules'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Netlify / Vercel Static Hosting Guide */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <span>Deploy to Netlify or Vercel</span>
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          MessMate is 100% static-hosting friendly! It requires <strong>zero custom servers or Docker containers</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-900 dark:text-white text-sm block mb-1">
              Deploy on Netlify
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
              <li>Push this project to your GitHub repository</li>
              <li>Log in to Netlify &gt; Add new site &gt; Import from GitHub</li>
              <li>Build command: <code>npm run build</code></li>
              <li>Publish directory: <code>dist</code></li>
              <li>(A <code>netlify.toml</code> file is included in this repository)</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-900 dark:text-white text-sm block mb-1">
              Deploy on Vercel
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
              <li>Import the GitHub repo directly in Vercel</li>
              <li>Framework preset: <strong>Vite</strong></li>
              <li>Output directory: <code>dist</code></li>
              <li>Click <strong>Deploy</strong> and your app is live in seconds!</li>
              <li>(A <code>vercel.json</code> file is included in this repository)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Account & Backup */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Current Account & Backup
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Logged in as: <strong className="text-slate-800 dark:text-slate-200">{user?.email || 'User'}</strong> ({allRecords.length} records saved)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportMonthlyRecordsToCSV(allRecords, getCurrentMonthKey())}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {user && allRecords.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Are you sure you want to clear all meal records? This will delete all logged expenses so you can start with a clean slate.')) {
                  await clearAllExpenses(user.uid, user);
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Records</span>
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
