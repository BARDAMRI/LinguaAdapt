import type { Exercise } from '../../engine/types';
import { ChoiceView } from './ChoiceView';
import type { DoneResult } from './common';
import { MatchView } from './MatchView';
import { SyllableView } from './SyllableView';
import { TeachView } from './TeachView';
import { TilesView } from './TilesView';
import { TraceView } from './TraceView';
import { TypeView } from './TypeView';

export function ExerciseView({ exercise, onDone, instant }: { exercise: Exercise; onDone: (r: DoneResult) => void; instant?: boolean }) {
  switch (exercise.type) {
    case 'teach':
      return <TeachView exercise={exercise} onDone={onDone} />;
    case 'choice':
      return <ChoiceView exercise={exercise} onDone={onDone} instant={instant} />;
    case 'match':
      return <MatchView exercise={exercise} onDone={onDone} />;
    case 'tiles':
      return <TilesView exercise={exercise} onDone={onDone} />;
    case 'type':
      return <TypeView exercise={exercise} onDone={onDone} />;
    case 'trace':
      return <TraceView exercise={exercise} onDone={onDone} />;
    case 'syllables':
      return <SyllableView exercise={exercise} onDone={onDone} />;
  }
}

export type { DoneResult };
