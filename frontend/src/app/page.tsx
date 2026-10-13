import { Metadata } from 'next';
import { ViewerContainer } from '@/features/judging/components/viewer-container';

export const metadata: Metadata = {
  title: 'Live Video Judging & Continuous Voting | Woofskis',
  description:
    'Evaluate high-stakes contest entries in a continuous vertical video loop with instant real-time community score consensus.',
};

export default function RootPage() {
  return <ViewerContainer />;
}
