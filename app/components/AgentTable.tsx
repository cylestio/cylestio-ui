'use client'

import { useEffect, useState } from 'react'
import { Agent } from '../lib/db'

export default function AgentTable() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch('/api/agents')
        if (!response.ok) {
          throw new Error('Failed to fetch agents')
        }
        const data = await response.json()
        setAgents(data)
      } catch (err) {
        setError('Error loading agents')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  if (loading) return <div className="text-center p-4">Loading agents...</div>
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Agents</h2>
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b text-left">ID</th>
            <th className="py-2 px-4 border-b text-left">Name</th>
            <th className="py-2 px-4 border-b text-left">Status</th>
            <th className="py-2 px-4 border-b text-left">Last Active</th>
            <th className="py-2 px-4 border-b text-left">Type</th>
          </tr>
        </thead>
        <tbody>
          {agents.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-4 px-4 text-center">No agents found</td>
            </tr>
          ) : (
            agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{agent.id}</td>
                <td className="py-2 px-4 border-b">{agent.name}</td>
                <td className="py-2 px-4 border-b">
                  <span className={`px-2 py-1 rounded text-xs ${
                    agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {agent.status}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">{new Date(agent.last_active).toLocaleString()}</td>
                <td className="py-2 px-4 border-b">{agent.type}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
} 