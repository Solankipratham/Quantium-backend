import { chooseDriver, getDriver } from "../data/store.js";

export async function initDb() {
  const driver = await chooseDriver();
  return driver;
}

export function dbStatus() {
  return getDriver();
}