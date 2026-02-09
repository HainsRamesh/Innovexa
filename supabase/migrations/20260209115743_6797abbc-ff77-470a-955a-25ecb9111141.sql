-- Attach the existing notify_on_problem_interest trigger function to the problem_interests table
DROP TRIGGER IF EXISTS trigger_notify_problem_interest ON public.problem_interests;
CREATE TRIGGER trigger_notify_problem_interest
AFTER INSERT ON public.problem_interests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_problem_interest();

-- Also attach innovation interest trigger if missing
DROP TRIGGER IF EXISTS trigger_notify_innovation_interest ON public.innovation_interests;
CREATE TRIGGER trigger_notify_innovation_interest
AFTER INSERT ON public.innovation_interests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_innovation_interest();