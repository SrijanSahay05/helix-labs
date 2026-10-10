import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { TypeText } from '@/components/ai/TypeText';
import { Button } from '@/components/ui/Button';
import { useUI } from '@/store/ui';
import { useProjects } from '@/store/project';
import { StepWho } from '@/features/intake/steps/StepWho';

/** Step 0 shown once, until the mode is remembered for this user. */
export function OnboardingWho() {
  const nav = useNavigate();
  const mode = useProjects((s) => s.draft.mode);
  const setMode = useUI((s) => s.setMode);
  return (
    <div className="mx-auto max-w-[900px] space-y-6 py-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <AgentBadge id="conductor" preset="hero" size={96} placement="onboarding" status="waiting" wakeOnHover />
        <div>
          <div className="eyebrow text-accent">Welcome</div>
          <h1 className="h1 mt-1">
            <TypeText inline text="Welcome to Helix. Who is using it?" id="onboard-h" />
          </h1>
          <p className="lead mt-2">
            <TypeText inline text="Pick how you'd like me to talk to you." id="onboard-sub" className="font-display" /> This sets the language and the next screens. Helix remembers it, and you can switch from the top bar any time.
          </p>
        </div>
      </div>
      <StepWho />
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          disabled={!mode}
          onClick={() => {
            setMode(mode!, true);
            useProjects.getState().patchDraft({ mode: undefined, meta: {} });
            nav('/projects');
          }}
        >
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
