export default function CompetencyReviewsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse mr-4"></div>
              <div>
                <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-64 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Tabs skeleton */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="ml-4">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>

              {/* Filter skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              {/* Reviews skeleton */}
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div>
                          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                          <div className="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-28 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
