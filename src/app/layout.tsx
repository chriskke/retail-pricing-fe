import type { Metadata } from 'next';
import '../styles/globals.css';
import Sidebar from '../components/Sidebar';
import { ActionProvider } from '../context/ActionContext';

export const metadata: Metadata = {
  title: 'Retail Analytics Dashboard',
  description: 'Competitor pricing analysis tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ActionProvider>
          <div className="app-container">
            <div className="sidebar-wrapper">
              <Sidebar />
            </div>
            <main className="main-content">
              {children}
            </main>
          </div>
        </ActionProvider>
      </body>
    </html>
  );
}
