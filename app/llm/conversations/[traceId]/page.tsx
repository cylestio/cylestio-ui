export const revalidate = 0;
export const dynamic = 'force-dynamic';

import LLMExplorerContainer from '../../../components/llm/LLMExplorerContainer';

export default function LLMConversationPage({ params }: { params: { traceId: string } }) {
  // Pass the traceId as a searchParam to make it compatible with the component
  const searchParams = { traceId: params.traceId };
  return <LLMExplorerContainer searchParams={searchParams} />;
} 