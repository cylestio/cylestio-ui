'use client'

import { useEffect, useState } from 'react'
import { Event } from '../lib/db'

export default function EventTable() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events')
        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }
        const data = await response.json()
        setEvents(data)
      } catch (err) {
        setError('Error loading events')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (loading) return <div className="text-center p-4">Loading events...</div>
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div className="overflow-x-auto mt-8">
      <h2 className="text-xl font-semibold mb-4">Events</h2>
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b text-left">ID</th>
            <th className="py-2 px-4 border-b text-left">Timestamp</th>
            <th className="py-2 px-4 border-b text-left">Type</th>
            <th className="py-2 px-4 border-b text-left">Level</th>
            <th className="py-2 px-4 border-b text-left">Message</th>
            <th className="py-2 px-4 border-b text-left">Agent ID</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-4 px-4 text-center">No events found</td>
            </tr>
          ) : (
            events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{event.id}</td>
                <td className="py-2 px-4 border-b">{new Date(event.timestamp).toLocaleString()}</td>
                <td className="py-2 px-4 border-b">{event.event_type}</td>
                <td className="py-2 px-4 border-b">
                  <span className={`px-2 py-1 rounded text-xs ${
                    event.level === 'error' ? 'bg-red-100 text-red-800' : 
                    event.level === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {event.level}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">{event.message}</td>
                <td className="py-2 px-4 border-b">{event.agent_id}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
} 