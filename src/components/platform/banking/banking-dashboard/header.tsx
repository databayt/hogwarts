import type { User } from '@/lib/auth';
import type { getDictionary } from '@/components/local/dictionaries';

interface Props {
  user: User;
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
}

export default function BankingDashboardHeader(props: Props) {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? props.dictionary.greetingMorning :
    currentHour < 18 ? props.dictionary.greetingAfternoon :
    props.dictionary.greetingEvening;

  return (
    <header className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">
        {greeting}, {props.user.name || props.dictionary.guestUser}
      </h1>
      <p className="text-muted-foreground">
        {props.dictionary.dashboardSubtext}
      </p>
    </header>
  );
}