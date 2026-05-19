import HookScene       from './scenes/HookScene';
import ConceptScene    from './scenes/ConceptScene';
import BreakdownScene  from './scenes/BreakdownScene';
import TwoSidesScene   from './scenes/TwoSidesScene';
import ContextScene    from './scenes/ContextScene';
import SSBScene        from './scenes/SSBScene';
import QuizScene       from './scenes/QuizScene';

const SCENE_MAP = {
  hook:            HookScene,
  concept:         ConceptScene,
  breakdown:       BreakdownScene,
  two_sides:       TwoSidesScene,
  context:         ContextScene,
  ssb_application: SSBScene,
  quiz:            QuizScene,
};

export default function SceneRenderer({ scene, article }) {
  const Component = SCENE_MAP[scene.type];
  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full px-6 text-center">
        <p className="text-sm text-gray-400">Unknown scene type: {scene.type}</p>
      </div>
    );
  }
  return <Component scene={scene} article={article} />;
}
