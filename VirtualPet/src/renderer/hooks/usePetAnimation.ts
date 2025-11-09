import { useCallback, useMemo, useState } from 'react';
import {
  DEFAULT_PET_STATE,
  getPetAnimation,
  petAnimations,
  type PetAnimationState,
} from '../constants/petAnimations';

export type UsePetAnimationResult = {
  state: PetAnimationState;
  animation: ReturnType<typeof getPetAnimation>;
  setPetAnimation: (state: PetAnimationState) => void;
  togglePetAnimation: (nextState?: PetAnimationState) => void;
};

export function usePetAnimation(
  initialState: PetAnimationState = DEFAULT_PET_STATE,
): UsePetAnimationResult {
  const [state, setState] = useState(initialState);

  const animation = useMemo(() => getPetAnimation(state), [state]);

  const setPetAnimation = useCallback(
    (nextState: PetAnimationState) => {
      if (nextState === state) {
        return;
      }
      setState(nextState);
    },
    [state],
  );

  const togglePetAnimation = useCallback(
    (nextState?: PetAnimationState) => {
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
