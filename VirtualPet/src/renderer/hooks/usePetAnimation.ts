import { useCallback, useMemo, useState } from 'react';
import {
  DEFAULT_PET_STATE,
  getPetAnimation,
  petAnimations,
} from '../constants/petAnimations';

export type UsePetAnimationResult = {
  state: string;
  animation: ReturnType<typeof getPetAnimation>;
  setPetAnimation: (state: string) => void;
  togglePetAnimation: (nextState?: string) => void;
};

export function usePetAnimation(
  initialState = DEFAULT_PET_STATE,
): UsePetAnimationResult {
  const [state, setState] = useState(initialState);

  const animation = useMemo(() => getPetAnimation(state), [state]);

  const setPetAnimation = useCallback(
    (nextState: string) => {
      if (nextState === state) {
        return;
      }
      setState(nextState);
    },
    [state],
  );

  const togglePetAnimation = useCallback(
    (nextState?: string) => {
      if (nextState) {
        setState(nextState);
        return;
      }

      const currentIndex = petAnimations.findIndex(
        (entry) => entry.state === state,
      );
      const nextIndex =
        currentIndex >= 0 ? (currentIndex + 1) % petAnimations.length : 0;
      setState(petAnimations[nextIndex].state);
    },
    [state],
  );

  return {
    state,
    animation,
    setPetAnimation,
    togglePetAnimation,
  };
}
