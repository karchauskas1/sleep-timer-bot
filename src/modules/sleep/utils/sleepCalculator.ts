/**
 * Sleep calculator utility for calculating optimal sleep/wake times
 *
 * Based on 90-minute sleep cycles and a 15-minute fall asleep time.
 * Provides two modes:
 * - bedtime: Given when you're going to bed, calculates optimal wake times
 * - waketime: Given when you need to wake, calculates optimal bedtimes
 *
 * Per the design philosophy, no recommendations or moralizing - just the facts.
 */

import { addMinutes, subMinutes } from 'date-fns';
import type { SleepOption, SleepMode } from '@/types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Duration of one sleep cycle in minutes
 * A complete sleep cycle typically lasts about 90 minutes
 */
export const CYCLE_MINUTES = 90;

/**
 * Average time it takes to fall asleep in minutes
 * This offset is added when calculating times
 */
export const FALL_ASLEEP_MINUTES = 15;

/**
 * Minimum number of sleep cycles to suggest
 * 3 cycles = 4.5 hours of sleep
 */
export const MIN_CYCLES = 3;

/**
 * Maximum number of sleep cycles to suggest
 * 6 cycles = 9 hours of sleep
 */
export const MAX_CYCLES = 6;

// =============================================================================
// Core Calculation Functions
// =============================================================================

/**
 * Calculate optimal wake times based on when you're going to bed
 *
 * Mode A: "I'm going to bed at [time]" → shows 4 wake time options (3-6 cycles)
 *
 * @param bedTime - The time you're going to bed
 * @returns Array of SleepOption objects with wake times and cycle counts
 *
 * @example
 * const bedTime = new Date('2026-02-02T23:00:00');
 * const wakeOptions = calculateWakeTimes(bedTime);
 * // Returns times like: 4:00 (3 cycles), 5:30 (4 cycles), 7:00 (5 cycles), 8:30 (6 cycles)
 */
export function calculateWakeTimes(bedTime: Date): SleepOption[] {
  const results: SleepOption[] = [];

  // Calculate when you'll actually fall asleep
  const asleepTime = addMinutes(bedTime, FALL_ASLEEP_MINUTES);

  // Generate wake time options for each cycle count (3-6 cycles)
  for (let cycles = MIN_CYCLES; cycles <= MAX_CYCLES; cycles++) {
    const sleepDuration = cycles * CYCLE_MINUTES;
    const wakeTime = addMinutes(asleepTime, sleepDuration);

    results.push({
      time: wakeTime,
      cycles,
    });
  }

  return results;
}

/**
 * Calculate optimal bedtimes based on when you need to wake up
 *
 * Mode B: "I need to wake at [time]" → shows 4 sleep time options (6-3 cycles)
 *
 * @param wakeTime - The time you need to wake up
 * @returns Array of SleepOption objects with bedtimes and cycle counts (sorted by time, earliest first)
 *
 * @example
 * const wakeTime = new Date('2026-02-03T07:00:00');
 * const sleepOptions = calculateSleepTimes(wakeTime);
 * // Returns times like: 21:15 (6 cycles), 22:45 (5 cycles), 00:15 (4 cycles), 01:45 (3 cycles)
 */
export function calculateSleepTimes(wakeTime: Date): SleepOption[] {
  const results: SleepOption[] = [];

  // Generate bedtime options for each cycle count (starting from max for better display order)
  for (let cycles = MAX_CYCLES; cycles >= MIN_CYCLES; cycles--) {
    // Total sleep needed = cycles * 90 minutes + 15 minutes to fall asleep
    const sleepNeeded = cycles * CYCLE_MINUTES + FALL_ASLEEP_MINUTES;
    const bedTime = subMinutes(wakeTime, sleepNeeded);

    results.push({
      time: bedTime,
      cycles,
    });
  }

  return results;
}

// =============================================================================
// Unified Calculator Interface
// =============================================================================

/**
 * Calculate sleep/wake times based on the selected mode
 *
 * @param mode - The calculation mode: 'bedtime' or 'waketime'
 * @param inputTime - The reference time for calculation
 * @returns Array of SleepOption objects
 *
 * @example
 * // Mode A: Calculate wake times from bedtime
 * const wakeOptions = calculateSleepOptions('bedtime', new Date('2026-02-02T23:00:00'));
 *
 * @example
 * // Mode B: Calculate bedtimes from wake time
 * const sleepOptions = calculateSleepOptions('waketime', new Date('2026-02-03T07:00:00'));
 */
export function calculateSleepOptions(mode: SleepMode, inputTime: Date): SleepOption[] {
  if (mode === 'bedtime') {
    return calculateWakeTimes(inputTime);
  }
  return calculateSleepTimes(inputTime);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the total sleep duration in minutes for a given number of cycles
 *
 * @param cycles - Number of sleep cycles
 * @returns Total minutes of actual sleep (not including fall asleep time)
 */
export function getSleepDurationMinutes(cycles: number): number {
  return cycles * CYCLE_MINUTES;
}

/**
 * Get the total time in bed in minutes (including fall asleep time)
 *
 * @param cycles - Number of sleep cycles
 * @returns Total minutes in bed
 */
export function getTotalBedTimeMinutes(cycles: number): number {
  return cycles * CYCLE_MINUTES + FALL_ASLEEP_MINUTES;
}

/**
 * Format sleep duration as hours and minutes
 * Returns just the numbers without any judgment or recommendations
 *
 * @param cycles - Number of sleep cycles
 * @returns Formatted string like "7 ч 30 мин"
 */
export function formatSleepDuration(cycles: number): string {
  const totalMinutes = getSleepDurationMinutes(cycles);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} ч`;
  }
  return `${hours} ч ${minutes} мин`;
}

/**
 * Round a date to the nearest 5 minutes
 * Useful for cleaner time input handling
 *
 * @param date - The date to round
 * @returns A new Date rounded to the nearest 5 minutes
 */
export function roundToNearestFiveMinutes(date: Date): Date {
  const result = new Date(date);
  const minutes = result.getMinutes();
  const remainder = minutes % 5;

  if (remainder < 3) {
    result.setMinutes(minutes - remainder);
  } else {
    result.setMinutes(minutes + (5 - remainder));
  }

  result.setSeconds(0);
  result.setMilliseconds(0);

  return result;
}

/**
 * Create a Date object for a specific time today or tomorrow
 *
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @param preferTomorrow - If true and the time has passed today, use tomorrow
 * @returns Date object set to the specified time
 */
export function createTimeForToday(
  hours: number,
  minutes: number,
  preferTomorrow: boolean = false
): Date {
  const now = new Date();
  const result = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0
  );

  // If the time has passed and we prefer tomorrow, add a day
  if (preferTomorrow && result <= now) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

/**
 * Get current time rounded to nearest 5 minutes
 * Useful for initializing the bedtime mode with "now"
 *
 * @returns Current time rounded to nearest 5 minutes
 */
export function getCurrentTimeRounded(): Date {
  return roundToNearestFiveMinutes(new Date());
}
