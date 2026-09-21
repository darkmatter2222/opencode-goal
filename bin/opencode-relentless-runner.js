#!/usr/bin/env node
import { runHost } from "../dist/runner.js"
runHost().catch(error => { console.error(error.message); process.exitCode = 1 })
