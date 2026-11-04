import { Search } from 'lucide-react'

export default function SearchFilter({ searchTerm, setSearchTerm, placeholder = "Search..." }) {
  return (
    <div className="relative w-full max-w-md mb-4">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
        <Search size={18} />
      </div>
      <input
        type="text"
        className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  )
}