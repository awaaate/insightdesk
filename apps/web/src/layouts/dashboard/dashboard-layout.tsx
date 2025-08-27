import { SiteHeader } from "./site-header";

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <SiteHeader />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};
