import { Bell } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white border-b border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">Competitor Analysis</h2>
          <p className="text-sm text-neutral-600">Analyze top 10 Google search results for any keyword</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 flex items-center">
            <Bell className="mr-2" size={16} />
            Notifications
          </button>
          <div className="h-6 w-px bg-neutral-200"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-white">JD</span>
            </div>
            <span className="text-sm font-medium text-neutral-700">John Doe</span>
          </div>
        </div>
      </div>
    </header>
  );
}
