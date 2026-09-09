import CommandCenter from '@/components/command/CommandCenter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ORCA Command Center — Maritime Intelligence Dashboard',
  description:
    'ORCA Command Center: real-time maritime alert monitoring, data pipeline health, and coastal intelligence. Powered by GDACS and Open-Meteo.',
};

export default function CommandCenterPage() {
  return <CommandCenter />;
}
