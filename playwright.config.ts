import { defineConfig } from '@playwright/test';
import { existsSync,readdirSync } from 'node:fs';
import { homedir,tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
const qaDatabase=process.env.DOMSCOUT_QA_DATABASE||tmpdir()+'/domscout-browser-'+randomUUID()+'.sqlite';
process.env.DOMSCOUT_QA_DATABASE=qaDatabase;
const base=homedir()+'/.cache/ms-playwright';
const browser=existsSync(base)?readdirSync(base).filter(x=>/^chromium-/.test(x)).sort().reverse().map(x=>base+'/'+x+'/chrome-linux64/chrome').find(existsSync):undefined;
export default defineConfig({testDir:'./tests/browser',workers:1,timeout:30000,use:{baseURL:'http://127.0.0.1:4310',headless:true,launchOptions:{executablePath:process.env.CHROME_PATH||browser}},webServer:{command:'node dist/server.js',url:'http://127.0.0.1:4310/api/session',reuseExistingServer:false,env:{DATABASE_PATH:qaDatabase,PUBLIC_ORIGIN:'http://127.0.0.1:4310',PORT:'4310'}},reporter:[['list'],['json',{outputFile:'docs/qa/browser-results.json'}]]});
