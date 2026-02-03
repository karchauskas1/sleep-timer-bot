/**
 * useSound - Focused hook for audio playback in Telegram Mini Apps
 *
 * Provides a simple, ergonomic API for playing notification sounds.
 * All methods have graceful fallbacks for platforms that don't support
 * audio playback or when audio context is restricted.
 *
 * Sound types:
 * - chime: Light, pleasant chime sound
 * - bell: Soft bell notification
 * - tone: Gentle tone alert
 * - none: Silent (no sound)
 *
 * @example
 * // Basic usage
 * const sound = useSound();
 * sound.play('chime'); // Play chime sound
 *
 * @example
 * // In a timer completion handler
 * const sound = useSound();
 * const handleTimerComplete = () => {
 *   sound.play('bell');
 *   haptic.success();
 * };
 *
 * @example
 * // With sound preference from settings
 * const sound = useSound();
 * const soundPref = settings.soundPreference || 'chime';
 * sound.play(soundPref);
 */

import { useEffect, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

/**
 * Available sound types for notifications
 */
export type SoundType = 'chime' | 'bell' | 'tone' | 'none';

/**
 * Sound playback methods returned by the hook
 */
export interface UseSoundResult {
  /**
   * Play a notification sound
   * @param soundType - The type of sound to play
   */
  play: (soundType: SoundType) => void;

  /**
   * Play the chime sound
   */
  playChime: () => void;

  /**
   * Play the bell sound
   */
  playBell: () => void;

  /**
   * Play the tone sound
   */
  playTone: () => void;

  /**
   * Check if audio playback is supported on current platform
   */
  isSupported: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Map of sound types to their file paths
 */
const SOUND_PATHS: Record<Exclude<SoundType, 'none'>, string> = {
  chime: '/sounds/chime.mp3',
  bell: '/sounds/bell.mp3',
  tone: '/sounds/tone.mp3',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if audio playback is supported
 * Audio may be restricted on some platforms or require user interaction
 */
function checkAudioSupport(): boolean {
  try {
    return typeof Audio !== 'undefined' && typeof Audio.prototype.play === 'function';
  } catch {
    return false;
  }
}

/**
 * Create and preload an audio element
 * @param path - Path to the audio file
 * @returns Audio element or null if creation fails
 */
function createAudio(path: string): HTMLAudioElement | null {
  try {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audio.load();
    return audio;
  } catch {
    return null;
  }
}

/**
 * Safely play an audio element
 * @param audio - Audio element to play
 */
async function playAudio(audio: HTMLAudioElement | null): Promise<void> {
  if (!audio) return;

  try {
    // Reset to start if already playing
    audio.currentTime = 0;

    // Play returns a promise that may reject if user hasn't interacted with page
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      await playPromise;
    }
  } catch {
    // Silently fail - audio is enhancement, not requirement
    // Common reasons for failure:
    // - User hasn't interacted with page yet (autoplay policy)
    // - Audio file failed to load
    // - Browser doesn't support the audio format
  }
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for playing notification sounds in Telegram Mini Apps
 *
 * Preloads audio files on mount for instant playback.
 * All methods are safe to call even on platforms that don't support
 * audio playback or when playback fails.
 *
 * @returns Object with sound playback methods
 */
export function useSound(): UseSoundResult {
  // Cache audio elements in refs to persist across renders
  const audioCache = useRef<Record<string, HTMLAudioElement | null>>({});
  const isSupported = useRef(checkAudioSupport());

  // Preload audio files on mount
  useEffect(() => {
    if (!isSupported.current) return;

    // Create and cache audio elements
    Object.entries(SOUND_PATHS).forEach(([soundType, path]) => {
      if (!audioCache.current[soundType]) {
        audioCache.current[soundType] = createAudio(path);
      }
    });

    // Cleanup function to pause and clear audio elements
    return () => {
      Object.values(audioCache.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      audioCache.current = {};
    };
  }, []);

  /**
   * Play a sound by type
   */
  const play = (soundType: SoundType): void => {
    if (soundType === 'none') return;
    if (!isSupported.current) return;

    const audio = audioCache.current[soundType];
    playAudio(audio);
  };

  /**
   * Convenience method: play chime sound
   */
  const playChime = (): void => {
    play('chime');
  };

  /**
   * Convenience method: play bell sound
   */
  const playBell = (): void => {
    play('bell');
  };

  /**
   * Convenience method: play tone sound
   */
  const playTone = (): void => {
    play('tone');
  };

  return {
    play,
    playChime,
    playBell,
    playTone,
    isSupported: isSupported.current,
  };
}
