import Link from "next/link"

export default function OasisQAPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link href="/comprehensive-qa" className="block">
          <div className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow">
            Upgrade to Comprehensive Chart QA
          </div>
        </Link>
        <p className="text-gray-600 mt-2">Analyze complete patient charts, not just OASIS</p>
      </div>

      <h1 className="text-2xl font-bold mb-4">OASIS QA</h1>
      <p>This page will eventually contain the OASIS QA functionality.</p>
    </div>
  )
}
