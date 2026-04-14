import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen -mt-20">
      <div className="text-center max-w-md">
        <div className="bg-dd-surface border border-dd-border rounded-xl shadow-lg overflow-hidden">
          <div className="bg-dd-purple px-4 py-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-white text-sm font-medium">PSE Hub - Navigation Error</span>
          </div>
          <div className="p-8">
            <div className="text-6xl font-bold text-dd-purple mb-4">404</div>
            <h2 className="text-lg font-semibold text-dd-text mb-2">Page Not Found</h2>
            <p className="text-sm text-dd-text-secondary mb-6">
              The requested resource could not be located. It may have been moved or archived.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-dd-purple text-white text-sm font-medium rounded-lg hover:bg-dd-purple-light transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
