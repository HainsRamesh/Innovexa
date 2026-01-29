import { cn } from '@/lib/utils';

interface RobotPresenterPlaceholderProps {
  isAnimating: boolean;
  robotTheme?: string;
  className?: string;
}

/**
 * Placeholder 3D-like robot silhouette for the AI Narrator.
 * 
 * TODO: Replace with actual GLB model integration:
 * 1. Load GLB with useGLTF from @react-three/drei
 * 2. Use useAnimations to control Idle/Talk animation states
 * 3. Sync gesture timings from narratorData.gestures with animation triggers
 * 4. Map gestures: nod, open_palm_present, point, thumbs_up, wave
 * 5. Use narratorData.emotion to influence facial expressions if supported
 * 6. Apply robotTheme to select themed robot models (healthcare, finance, ai, etc.)
 */
export function RobotPresenterPlaceholder({
  isAnimating,
  robotTheme = 'general',
  className,
}: RobotPresenterPlaceholderProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        'w-16 h-16 rounded-lg',
        'bg-gradient-to-br from-primary/20 to-primary/5',
        'border border-primary/20',
        'overflow-hidden',
        className
      )}
    >
      {/* Robot silhouette - minimal 3D-like representation */}
      <div className="relative">
        {/* Head */}
        <div
          className={cn(
            'w-6 h-6 rounded-lg bg-gradient-to-b from-primary/60 to-primary/40',
            'shadow-inner border border-primary/30',
            'transition-transform duration-300',
            isAnimating && 'animate-[robotTalk_0.3s_ease-in-out_infinite]'
          )}
        >
          {/* Eyes */}
          <div className="absolute top-1.5 left-1 w-1.5 h-1 rounded-full bg-background/80" />
          <div className="absolute top-1.5 right-1 w-1.5 h-1 rounded-full bg-background/80" />
          
          {/* Mouth indicator - animates when talking */}
          <div
            className={cn(
              'absolute bottom-1 left-1/2 -translate-x-1/2',
              'w-2 rounded-full bg-background/60',
              'transition-all duration-150',
              isAnimating ? 'h-1' : 'h-0.5'
            )}
          />
        </div>

        {/* Neck */}
        <div className="mx-auto w-2 h-1 bg-primary/30" />

        {/* Body */}
        <div
          className={cn(
            'w-8 h-5 -mt-0.5 rounded-t-lg bg-gradient-to-b from-primary/50 to-primary/30',
            'border border-primary/20 border-b-0',
            'transition-transform duration-500',
            isAnimating && 'animate-[robotBreathe_2s_ease-in-out_infinite]'
          )}
        />
      </div>

      {/* Ambient glow when active */}
      {isAnimating && (
        <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
      )}

      {/* Theme indicator dot */}
      <div
        className={cn(
          'absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full',
          robotTheme === 'healthcare' && 'bg-red-400',
          robotTheme === 'finance' && 'bg-green-400',
          robotTheme === 'education' && 'bg-blue-400',
          robotTheme === 'climate' && 'bg-emerald-400',
          robotTheme === 'ai' && 'bg-violet-400',
          robotTheme === 'security' && 'bg-orange-400',
          robotTheme === 'general' && 'bg-primary/60'
        )}
      />
    </div>
  );
}
