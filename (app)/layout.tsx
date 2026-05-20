import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-56 flex-1 min-h-screen bg-gray-50 p-8">
        {children}
      </main>
    </div>
  )
}
