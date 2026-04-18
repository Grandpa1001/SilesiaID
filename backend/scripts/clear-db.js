"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Czyści dane aplikacji (certyfikaty + verify_events).
 * Uruchom z katalogu backend: npm run db:clear
 */
require("dotenv/config");
const schema_1 = require("../src/db/schema");
(0, schema_1.clearApplicationData)();
