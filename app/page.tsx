export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AI Knowledge Hub</h1>
        <p className="text-gray-600 mb-8">
          YouTube transcript indexing system for AI Daily Brief and more
        </p>
        <div className="bg-gray-100 p-6 rounded-lg max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <p className="text-sm text-gray-700">
            This application automatically fetches transcripts from configured YouTube channels
            daily at 7 AM ET and stores them in your Notion knowledge base.
          </p>
        </div>
      </div>
    </main>
  );
}
