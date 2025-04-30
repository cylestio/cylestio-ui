export const revalidate = 0;
export const dynamic = 'force-dynamic';

import LLMExplorerContainer from '../../components/llm/LLMExplorerContainer';

export default function LLMConversationsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return <LLMExplorerContainer searchParams={searchParams} />;
} 