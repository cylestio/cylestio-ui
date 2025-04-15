import { redirect } from 'next/navigation';

export default function LLMRequestDetailPage({ params }: { params: { id: string } }) {
  // Redirect to the main LLM page with the request ID as a query parameter
  redirect(`/llm?requestId=${params.id}&tab=1`);
} 