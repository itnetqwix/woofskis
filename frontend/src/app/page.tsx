import { Metadata } from 'next';
import { ViewerContainer } from '@/features/judging/components/viewer-container';
import { buildVideoShareMetadata } from '@/features/judging/lib/share-metadata';

const defaultMetadata: Metadata = {
  title: 'Live Video Judging & Continuous Voting | Woofskis',
  description:
    'Evaluate high-stakes contest entries in a continuous vertical video loop with instant real-time community score consensus.',
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { v?: string | string[] };
}): Promise<Metadata> {
  const videoId = Array.isArray(searchParams.v) ? searchParams.v[0] : searchParams.v;
  return (await buildVideoShareMetadata(videoId)) ?? defaultMetadata;
}

export default function RootPage() {
  return <ViewerContainer />;
}
