// alarm.js — the alarm meter is the game's heartbeat. Being seen fills it;
// staying hidden drains it. At 100 the alarm trips: every guard hunts the
// last place the thief was seen, and the meter only falls again once the
// thief breaks contact. The catch is fair because the meter always warns
// first: it climbs in plain sight and drains when you hide.

import { startAlarmLoop, stopAlarmLoop } from "./audio.js";

export const ALARM_MAX = 100;
export const ALARM_TRIP = 100;
export const ALARM_CLEAR = 30;
export const GUARD_FILL_RATE = 26; // per second at full read strength
export const CAMERA_FILL_RATE = 20;
export const DRAIN_RATE = 13;
export const ALARM_DRAIN_RATE = 8;

export function createAlarm() {
  return {
    value: 0,
    active: false,
    lastSeen: null, // { x, y } — where the thief was last spotted
    trips: 0,
  };
}

// seenStrength: 0 when hidden, higher when a guard or camera has a clear,
// close read. stanceMultiplier: sprinting reads faster, crouching slower.
export function updateAlarm(alarm, seenStrength, stanceMultiplier, dt) {
  if (seenStrength > 0) {
    alarm.value += seenStrength * stanceMultiplier * dt;
    if (alarm.value >= ALARM_TRIP) {
      alarm.value = ALARM_MAX;
      if (!alarm.active) {
        alarm.active = true;
        alarm.trips += 1;
        startAlarmLoop();
      }
    }
  } else {
    const drain = alarm.active ? ALARM_DRAIN_RATE : DRAIN_RATE;
    alarm.value = Math.max(0, alarm.value - drain * dt);
    if (alarm.active && alarm.value <= ALARM_CLEAR) {
      alarm.active = false;
      stopAlarmLoop();
    }
  }
  return alarm;
}

export function alarmLevel(alarm) {
  if (alarm.active) return "alarm";
  if (alarm.value >= 60) return "high";
  if (alarm.value >= 25) return "rising";
  return "calm";
}

export function resetAlarmSound() {
  stopAlarmLoop();
}
