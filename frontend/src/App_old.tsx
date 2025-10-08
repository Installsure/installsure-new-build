import { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import FileUpload from "./components/FileUpload";
import EstimationView from "./components/Estimation";
import type { Estimation } from "./types";

export default function App() {
  const [estimation, setEstimation] = useState<Estimation | null>(null);

  return (
    <div className="min-h-screen">
      <Header />
      <Dashboard />
      <FileUpload onDone={(e) => setEstimation(e)} />
      <EstimationView data={estimation} />
    </div>
  );
}
                    </Link>
                    <Link
                      to="/settings"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Settings
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/viewer/:urn" element={<Viewer />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
