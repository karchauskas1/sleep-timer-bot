/**
 * Onboarding - First-time user onboarding flow component
 *
 * Displays a brief, elegant introduction to the ЩА (SHA) Mini App
 * for first-time users. Shows 3 slides covering the main features.
 *
 * Features:
 * - 3 laconic slides with smooth AnimatePresence transitions
 * - Progress indicator dots
 * - Skip button to bypass onboarding
 * - Swipe gesture support for mobile navigation
 * - Haptic feedback on interactions
 *
 * @example
 * // Basic usage in App.tsx
 * const { isCompleted, completeOnboarding } = useOnboarding();
 *
 * if (!isCompleted) {
 *   return <Onboarding onComplete={completeOnboarding} />;
 * }
 */

import { useState, useCallback } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import type { OnboardingSlide } from '@/types';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/**
 * Animation configuration for slide transitions
 */
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * Animation variants for slide transitions
 */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

/**
 * Animation variants for container fade
 */
const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Minimum swipe distance to trigger slide change
 */
const SWIPE_THRESHOLD = 50;

// =============================================================================
// Slide Illustrations
// =============================================================================

/**
 * Welcome slide illustration - Stylized app logo
 */
function WelcomeIllustration() {
  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: 'var(--radius-2xl)',
        backgroundColor: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <span
        style={{
          fontSize: 48,
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-inverse)',
          fontFamily: 'var(--font-family)',
        }}
      >
        ЩА
      </span>
    </div>
  );
}

/**
 * Tasks slide illustration - Checklist icon
 */
function TasksIllustration() {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      style={{ color: 'var(--color-accent)' }}
    >
      <rect
        x="15"
        y="20"
        width="70"
        height="60"
        rx="8"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M30 42L40 52L55 37"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="65"
        y1="45"
        x2="75"
        y2="45"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="35" cy="65" r="4" fill="currentColor" opacity="0.3" />
      <line
        x1="50"
        y1="65"
        x2="75"
        y2="65"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/**
 * Sleep & Timer slide illustration - Moon and clock
 */
function SleepTimerIllustration() {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      style={{ color: 'var(--color-accent)' }}
    >
      {/* Moon */}
      <path
        d="M30 65C30 45 45 30 65 30C45 30 30 45 30 65C30 75 40 85 55 85C40 85 30 75 30 65Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M35 50C35 35 50 25 65 30C50 25 35 35 35 50C35 65 50 75 65 70C50 80 35 65 35 50Z"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      {/* Timer/Clock */}
      <circle
        cx="65"
        cy="60"
        r="20"
        stroke="currentColor"
        strokeWidth="3"
        fill="var(--color-bg)"
      />
      <line
        x1="65"
        y1="60"
        x2="65"
        y2="48"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="65"
        y1="60"
        x2="75"
        y2="60"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// =============================================================================
// Slide Data
// =============================================================================

/**
 * Onboarding slides content
 * Kept laconic - 3 slides maximum as per spec
 */
const SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Добро пожаловать',
    description: 'Простой планировщик для спокойной продуктивности',
    illustration: <WelcomeIllustration />,
  },
  {
    id: 'tasks',
    title: 'Управляйте задачами',
    description: 'Быстро добавляйте, откладывайте и завершайте дела',
    illustration: <TasksIllustration />,
  },
  {
    id: 'sleep-timer',
    title: 'Сон и таймер',
    description: 'Считайте циклы сна и отслеживайте время',
    illustration: <SleepTimerIllustration />,
  },
];

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the Onboarding component
 */
interface OnboardingProps {
  /** Callback fired when onboarding is completed or skipped */
  onComplete: () => void;
  /** Additional CSS class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Onboarding component
 *
 * Full-screen onboarding flow with animated slides.
 * Users can navigate with buttons or swipe gestures.
 *
 * @param props - Component props
 */
export function Onboarding({ onComplete, className = '' }: OnboardingProps) {
  const haptic = useHaptic();

  // Current slide index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Direction for animation (1 = forward, -1 = backward)
  const [[, direction], setSlideState] = useState([0, 0]);

  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Navigate to next slide or complete onboarding
   */
  const handleNext = useCallback(() => {
    haptic.light();
    if (isLastSlide) {
      onComplete();
    } else {
      setSlideState([currentIndex + 1, 1]);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [haptic, isLastSlide, onComplete, currentIndex]);

  /**
   * Navigate to previous slide
   */
  const handlePrevious = useCallback(() => {
    if (!isFirstSlide) {
      haptic.light();
      setSlideState([currentIndex - 1, -1]);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [haptic, isFirstSlide, currentIndex]);

  /**
   * Skip onboarding
   */
  const handleSkip = useCallback(() => {
    haptic.light();
    onComplete();
  }, [haptic, onComplete]);

  /**
   * Handle swipe gesture
   */
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset } = info;

      if (offset.x < -SWIPE_THRESHOLD && !isLastSlide) {
        handleNext();
      } else if (offset.x > SWIPE_THRESHOLD && !isFirstSlide) {
        handlePrevious();
      }
    },
    [handleNext, handlePrevious, isFirstSlide, isLastSlide]
  );

  /**
   * Navigate to specific slide via dot
   */
  const handleDotClick = useCallback(
    (index: number) => {
      haptic.light();
      const newDirection = index > currentIndex ? 1 : -1;
      setSlideState([index, newDirection]);
      setCurrentIndex(index);
    },
    [haptic, currentIndex]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={ANIMATION_CONFIG}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg)',
        zIndex: 'var(--z-modal)',
        fontFamily: 'var(--font-family)',
      }}
    >
      {/* Skip Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: 'var(--space-md)',
          paddingTop: 'calc(var(--space-md) + var(--safe-area-top))',
        }}
      >
        <button
          type="button"
          onClick={handleSkip}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            fontSize: 'var(--font-sm)',
            color: 'var(--color-text-secondary)',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-family)',
            minHeight: 'var(--min-touch-target)',
            transition: 'var(--transition-colors)',
          }}
        >
          Пропустить
        </button>
      </div>

      {/* Slide Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          touchAction: 'pan-y',
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={ANIMATION_CONFIG}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-xl)',
              textAlign: 'center',
              width: '100%',
              cursor: 'grab',
            }}
          >
            {/* Illustration */}
            <div
              style={{
                marginBottom: 'var(--space-2xl)',
              }}
            >
              {currentSlide.illustration}
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: 'var(--font-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-md)',
                lineHeight: 'var(--line-height-tight)',
                letterSpacing: 'var(--letter-spacing-tight)',
              }}
            >
              {currentSlide.title}
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: 'var(--font-base)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-relaxed)',
                maxWidth: 280,
              }}
            >
              {currentSlide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div
        style={{
          padding: 'var(--space-lg)',
          paddingBottom: 'calc(var(--space-lg) + var(--safe-area-bottom))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-lg)',
        }}
      >
        {/* Progress Dots */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
          }}
          role="tablist"
          aria-label="Индикатор прогресса"
        >
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Слайд ${index + 1} из ${SLIDES.length}`}
              onClick={() => handleDotClick(index)}
              style={{
                width: index === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 'var(--radius-full)',
                backgroundColor:
                  index === currentIndex
                    ? 'var(--color-accent)'
                    : 'var(--color-border)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--duration-base) var(--ease-out)',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-md)',
            width: '100%',
            maxWidth: 320,
          }}
        >
          {/* Back Button */}
          {!isFirstSlide && (
            <button
              type="button"
              onClick={handlePrevious}
              style={{
                flex: 1,
                minHeight: 'var(--min-touch-target)',
                padding: 'var(--space-sm) var(--space-md)',
                fontSize: 'var(--font-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontFamily: 'var(--font-family)',
                transition: 'var(--transition-colors)',
              }}
            >
              Назад
            </button>
          )}

          {/* Next/Done Button */}
          <button
            type="button"
            onClick={handleNext}
            style={{
              flex: isFirstSlide ? 1 : 2,
              minHeight: 'var(--min-touch-target)',
              padding: 'var(--space-sm) var(--space-md)',
              fontSize: 'var(--font-base)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-inverse)',
              backgroundColor: 'var(--color-accent)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              fontFamily: 'var(--font-family)',
              transition: 'var(--transition-colors)',
            }}
          >
            {isLastSlide ? 'Начать' : 'Далее'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default Onboarding;
export type { OnboardingProps };
