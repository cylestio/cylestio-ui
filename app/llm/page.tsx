export const revalidate = 0;
export const dynamic = 'force-dynamic';

import LLMExplorerContainer from '../components/llm/LLMExplorerContainer';
import ResponsiveContainer from '../components/ResponsiveContainer';

export default function LLMExplorerPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="w-full max-w-full overflow-hidden">
      <LLMExplorerContainer searchParams={searchParams} />
    </div>
  );
} 