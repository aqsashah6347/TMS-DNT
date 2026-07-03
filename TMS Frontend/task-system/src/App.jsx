import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <div className="flex h-screen bg-bg">
      <Sidebar isAdmin={true} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName="Aqsa" />
        <main className="flex-1 overflow-y-auto p-6">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}
