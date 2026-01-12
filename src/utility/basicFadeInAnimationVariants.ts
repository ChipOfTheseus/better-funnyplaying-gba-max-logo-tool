import type { TargetAndTransition, Variants } from "motion/react";
import type { MotionNodeAnimationOptions } from "motion-dom";

export const addRandomFadeInDelayToAnimation = (animation: Variants) => {
  const transition = (animation.visible as TargetAndTransition).transition!;
  const spread = 0.15;
  transition.delay = Math.random() * spread;

  return animation;
};

export const basicFadeInAnimationVariants = (duration?: number, noHeight: boolean = true) => {
  const animation: Variants = {
    hidden: {
      y: 30,
      height: noHeight ? undefined : 0,
      opacity: 0,
      gap: 0,
      transition: {
        duration: duration ?? 0.35
      }
    },
    visible: {
      y: 0,
      height: noHeight ? undefined : "auto",
      opacity: 1,
      transition: {
        duration: duration ?? 0.5
      }
    }
  };

  return animation;
};

export const basicFadeInAnimationProps = (duration?: number, noHeight: boolean = true, addRandomDelay: boolean = true) => {
  let transition = basicFadeInAnimationVariants(duration, noHeight);
  if (addRandomDelay) {
    transition = addRandomFadeInDelayToAnimation(transition);
  }

  const props: MotionNodeAnimationOptions = {
    variants: transition,
    animate: "visible",
    initial: "hidden",
    exit: "hidden"
  };

  return props;
};