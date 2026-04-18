/**
 * Czyści dane aplikacji (certyfikaty + verify_events).
 * Uruchom z katalogu backend: npm run db:clear
 */
import "dotenv/config";
import { clearApplicationData } from "../src/db/schema";

clearApplicationData();
