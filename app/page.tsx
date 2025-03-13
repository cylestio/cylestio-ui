import AgentTable from './components/AgentTable'
import EventTable from './components/EventTable'

export default function Home() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Cylestio Monitor Dashboard</h1>
        <p className="text-gray-600">A minimal dashboard showing agents and events</p>
      </div>
      
      <AgentTable />
      <EventTable />
    </div>
  )
} 