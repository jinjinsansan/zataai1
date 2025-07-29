import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import ChatInterface from '@/components/chat/ChatInterface'

export default async function ChatPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="h-screen bg-gray-50">
      <ChatInterface />
    </div>
  )
}